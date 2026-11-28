import { io, Socket } from "socket.io-client";
import { SOCKET_URL, getAccessToken } from "./client";

//* One shared Socket.IO connection, opened while signed in. `auth` is a function so reconnects use the latest access token.
//* Events (server): message:new <Message>, typing {conversationId,userId,isTyping}, read {conversationId,userId,readAt}, notification:new.
let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket || !getAccessToken()) return socket;
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: (cb) => cb({ token: getAccessToken() }),
    reconnectionDelayMax: 10000,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
