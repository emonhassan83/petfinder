import { io, Socket } from "socket.io-client";
import { getAccessToken, getNewAccessToken, storeUserInfo } from "@/services/auth.services";

//* Socket.IO lives on the API origin (NEXT_PUBLIC_BACKEND_API_URL minus /api/v1).
//* Events: client -> message:send {conversationId, body} (ack), typing {conversationId, isTyping},
//* read {conversationId} (ack); server -> message:new <Message>, typing, read, notification:new.
const apiOrigin = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || "";
  try {
    return new URL(base).origin;
  } catch {
    return base.replace(/\/api(\/v1)?\/?$/, "");
  }
};

let socket: Socket | null = null;
let refreshTried = false;

export const getSocket = (): Socket | null => {
  if (typeof window === "undefined" || !getAccessToken()) return null;
  if (socket) return socket;

  socket = io(apiOrigin(), {
    //* callback form: every (re)connect sends the current token
    auth: (cb) => cb({ token: getAccessToken() }),
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    refreshTried = false;
  });

  //* Expired access token: refresh once, then reconnect with the new one
  socket.on("connect_error", async (err) => {
    if (err?.message !== "Unauthorized" || refreshTried) return;
    refreshTried = true;
    const token = await getNewAccessToken();
    if (token) {
      storeUserInfo({ accessToken: token });
      socket?.connect();
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
