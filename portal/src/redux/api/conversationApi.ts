import { IMeta } from "@/types";
import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

export type ChatUser = { id: string; name: string; profilePhoto?: string | null; role?: string };
export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: ChatUser;
};
export type Conversation = {
  id: string;
  petId: string | null;
  lastMessageAt: string | null;
  isFlagged: boolean;
  pet?: { id: string; name: string; image?: string; status?: string } | null;
  participants: ChatUser[];
  counterparts: ChatUser[];
  lastMessage?: ChatMessage | null;
  unreadCount: number;
};

//* /conversations: REST side of chat (live updates arrive over Socket.IO, see lib/socket.ts)
export const conversationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    chatGetConversations: build.query<{ items: Conversation[]; meta?: IMeta }, Record<string, any> | void>({
      query: (params) => ({ url: "/conversations", method: "GET", params: { limit: 50, ...(params || {}) } }),
      transformResponse: (res: Conversation[], meta: any) => ({ items: res ?? [], meta }),
      providesTags: [tagTypes.conversation],
    }),
    chatStartConversation: build.mutation<Conversation, { petId: string; message?: string; userId?: string }>({
      query: (data) => ({ url: "/conversations", method: "POST", data }),
      invalidatesTags: [tagTypes.conversation],
    }),
    chatGetMessages: build.query<
      { items: ChatMessage[]; nextCursor?: string | null },
      { conversationId: string; cursor?: string; limit?: number }
    >({
      query: ({ conversationId, cursor, limit = 30 }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: "GET",
        params: { limit, ...(cursor ? { cursor } : {}) },
      }),
      transformResponse: (res: any, meta: any) => ({
        items: Array.isArray(res) ? res : res?.messages ?? res?.items ?? [],
        nextCursor: meta?.nextCursor ?? res?.nextCursor ?? null,
      }),
      providesTags: (_r, _e, arg) => [{ type: tagTypes.message, id: arg.conversationId }],
    }),
    chatSendMessage: build.mutation<ChatMessage, { conversationId: string; body: string }>({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: "POST",
        data: { body },
      }),
    }),
    chatMarkRead: build.mutation<unknown, string>({
      query: (id) => ({ url: `/conversations/${id}/read`, method: "PATCH" }),
    }),
  }),
});

export const {
  useChatGetConversationsQuery,
  useChatStartConversationMutation,
  useChatGetMessagesQuery,
  useChatSendMessageMutation,
  useChatMarkReadMutation,
} = conversationApi;
