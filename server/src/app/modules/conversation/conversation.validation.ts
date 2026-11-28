import { z } from "zod";
import { idParams, paginationQuery, zBoolQuery, zId } from "../../../shared/validation";
import { MESSAGE_MAX_LENGTH } from "./conversation.constant";

export const messageBody = z
  .string({ error: "Message is required" })
  .trim()
  .min(1, "Message cannot be empty")
  .max(MESSAGE_MAX_LENGTH, `Message must be at most ${MESSAGE_MAX_LENGTH} characters`);

const list = z.object({
  query: z.object({
    ...paginationQuery(["lastMessageAt", "createdAt"]),
    //* Admins only: list conversations flagged by a dispute or report
    flagged: zBoolQuery.optional(),
  }),
});

//* Adopters start with just petId; a listing manager must name the adopter via userId
const create = z.object({
  body: z.object({
    petId: zId,
    userId: zId.optional(),
    message: messageBody.optional(),
  }),
});

const messages = z.object({
  params: idParams("conversationId"),
  query: z.object({
    cursor: zId.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

const send = z.object({
  params: idParams("conversationId"),
  body: z.object({ body: messageBody }),
});

const idParam = z.object({ params: idParams("conversationId") });

export const conversationSchema = { list, create, messages, send, idParam };
