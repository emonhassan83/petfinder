import { NotificationType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiErrors";
import { IPaginationOptions, IUser } from "../../interfaces";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { publicUserSelect } from "../../../shared/selects";
import { getPetManagerIds } from "../../../shared/ownership";
import { isAdminRole } from "../../../shared/roles";
import { notifySafe } from "../../../shared/notify";
import { emitToUser } from "../../../socket";
import { MESSAGE_MAX_LENGTH } from "./conversation.constant";

const petSummarySelect = { id: true, name: true, image: true, status: true } satisfies Prisma.PetSelect;

const messageInclude = { sender: { select: publicUserSelect } } satisfies Prisma.MessageInclude;

//* Returns the participant row, or throws 403/404. Admins pass only for flagged conversations (read-only).
const assertAccess = async (
  conversationId: string,
  user: Pick<IUser, "id" | "role">,
  opts: { write?: boolean } = {}
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, petId: true, isFlagged: true, participants: { select: { userId: true, lastReadAt: true } } },
  });
  if (!conversation) throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  const participant = conversation.participants.find((p) => p.userId === user.id);
  if (participant) return { conversation, participant, isParticipant: true };
  if (!opts.write && isAdminRole(user.role) && conversation.isFlagged) {
    return { conversation, participant: null, isParticipant: false };
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You are not part of this conversation");
};

//* Adopter <-> listing contact. The contact is the shelter owner (or pet creator for individual rehomers);
//* a listing manager may start a thread with an adopter by passing `userId`. One thread per pet and pair.
const createIntoDB = async (user: IUser, payload: { petId: string; userId?: string; message?: string }) => {
  const pet = await prisma.pet.findUnique({
    where: { id: payload.petId },
    select: { id: true, userId: true, shelter: { select: { userId: true } } },
  });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, "Pet not found");

  const managers = await getPetManagerIds(pet.id);
  const contactId = pet.shelter?.userId ?? pet.userId;
  let adopterId: string;
  let otherId: string;
  if (managers.includes(user.id)) {
    if (!payload.userId) throw new ApiError(httpStatus.BAD_REQUEST, "userId of the adopter is required");
    adopterId = payload.userId;
    otherId = user.id;
  } else {
    if (isAdminRole(user.role)) throw new ApiError(httpStatus.FORBIDDEN, "Admins cannot start conversations");
    adopterId = user.id;
    otherId = contactId;
  }
  if (adopterId === otherId || managers.includes(adopterId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot start a conversation with yourself");
  }
  const adopter = await prisma.user.findFirst({
    where: { id: adopterId, status: "ACTIVE", isDeleted: false, role: { in: ["USER", "OWNER"] } },
    select: { id: true },
  });
  if (!adopter) throw new ApiError(httpStatus.NOT_FOUND, "Adopter not found");

  let conversation = await prisma.conversation.findFirst({
    where: {
      petId: pet.id,
      AND: [{ participants: { some: { userId: adopterId } } }, { participants: { some: { userId: otherId } } }],
    },
    select: { id: true },
  });
  if (!conversation) {
    const application = await prisma.adoptionRequest.findUnique({
      where: { userId_petId: { userId: adopterId, petId: pet.id } },
      select: { id: true },
    });
    conversation = await prisma.conversation.create({
      data: {
        petId: pet.id,
        adoptionRequestId: application?.id,
        participants: { create: [{ userId: adopterId }, { userId: otherId }] },
      },
      select: { id: true },
    });
  }
  if (payload.message) await sendMessage(user, conversation.id, payload.message);
  return getOne(conversation.id, user);
};

const unreadCount = (conversationId: string, userId: string, lastReadAt: Date | null) =>
  prisma.message.count({
    where: {
      conversationId,
      deletedAt: null,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });

const summarize = async (id: string, viewer: IUser) => {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id },
    include: {
      pet: { select: petSummarySelect },
      participants: { select: { userId: true, lastReadAt: true, user: { select: publicUserSelect } } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1, include: messageInclude },
    },
  });
  const mine = conversation.participants.find((p) => p.userId === viewer.id);
  const { participants, messages, ...rest } = conversation;
  return {
    ...rest,
    participants: participants.map((p) => p.user),
    //* The other side(s) of the thread, for list rows
    counterparts: participants.filter((p) => p.userId !== viewer.id).map((p) => p.user),
    lastMessage: messages[0] ?? null,
    unreadCount: mine ? await unreadCount(id, viewer.id, mine.lastReadAt) : 0,
  };
};

const getOne = async (id: string, user: IUser) => {
  await assertAccess(id, user);
  return summarize(id, user);
};

const listMine = async (user: IUser, query: { flagged?: boolean }, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const where: Prisma.ConversationWhereInput =
    isAdminRole(user.role) && query.flagged
      ? { isFlagged: true }
      : { participants: { some: { userId: user.id } }, ...(query.flagged ? { isFlagged: true } : {}) };
  const [rows, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      select: { id: true },
    }),
    prisma.conversation.count({ where }),
  ]);
  const data = await Promise.all(rows.map((r) => summarize(r.id, user)));
  return { meta: { page, limit, total }, data };
};

//* Newest first; pass `cursor` = id of the last (oldest) message received to load older ones.
const listMessages = async (conversationId: string, user: IUser, query: { cursor?: string; limit?: number }) => {
  await assertAccess(conversationId, user);
  const limit = query.limit ?? 30;
  const rows = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: messageInclude,
  });
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { meta: { limit, hasMore, nextCursor: hasMore ? data[data.length - 1].id : null }, data };
};

//* Shared by REST and socket `message:send`: membership check, length limit, persist, fan out.
const sendMessage = async (user: Pick<IUser, "id" | "role">, conversationId: string, rawBody: string) => {
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) throw new ApiError(httpStatus.BAD_REQUEST, "Message cannot be empty");
  if (body.length > MESSAGE_MAX_LENGTH) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Message must be at most ${MESSAGE_MAX_LENGTH} characters`);
  }
  const { conversation } = await assertAccess(conversationId, user, { write: true });
  const recipients = conversation.participants.filter((p) => p.userId !== user.id).map((p) => p.userId);

  const activeRecipients = await prisma.user.count({
    where: { id: { in: recipients }, status: "ACTIVE", isDeleted: false },
  });
  if (recipients.length && !activeRecipients) {
    throw new ApiError(httpStatus.CONFLICT, "The other participant is no longer available");
  }

  const now = new Date();
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderId: user.id, body },
      include: messageInclude,
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } });
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: now },
    });
    return created;
  });

  for (const userId of [user.id, ...recipients]) emitToUser(userId, "message:new", message);

  //* One in-app notification per unread streak, not per message
  for (const userId of recipients) {
    const pending = await prisma.notification.count({
      where: {
        userId,
        type: NotificationType.MESSAGE,
        readAt: null,
        data: { path: ["conversationId"], equals: conversationId },
      },
    });
    if (!pending) {
      notifySafe(userId, {
        type: NotificationType.MESSAGE,
        title: `New message from ${message.sender?.name ?? "someone"}`,
        body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
        link: `/dashboard/messages?c=${conversationId}`,
        data: { conversationId },
      });
    }
  }
  return message;
};

const markRead = async (conversationId: string, user: Pick<IUser, "id" | "role">) => {
  const { participant, conversation } = await assertAccess(conversationId, user, { write: true });
  if (!participant) throw new ApiError(httpStatus.FORBIDDEN, "You are not part of this conversation");
  const readAt = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: readAt },
  });
  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      type: NotificationType.MESSAGE,
      readAt: null,
      data: { path: ["conversationId"], equals: conversationId },
    },
    data: { readAt },
  });
  const payload = { conversationId, userId: user.id, readAt };
  for (const p of conversation.participants) emitToUser(p.userId, "read", payload);
  return payload;
};

//* Other participants' ids, for typing indicators (membership enforced)
const getOtherParticipantIds = async (conversationId: string, user: Pick<IUser, "id" | "role">) => {
  const { conversation } = await assertAccess(conversationId, user, { write: true });
  return conversation.participants.filter((p) => p.userId !== user.id).map((p) => p.userId);
};

export const conversationService = {
  createIntoDB,
  getOne,
  listMine,
  listMessages,
  sendMessage,
  markRead,
  getOtherParticipantIds,
};
