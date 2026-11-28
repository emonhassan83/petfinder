import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import config from "../config";
import { resolveAccessToken } from "../app/middlewares/auth";
import { IUser } from "../app/interfaces";
import { logger } from "../shared/logger";

//* Socket.IO entry point. Handshake auth: the client sends the access token as
//* `io(url, { auth: { token } })` (or an `Authorization: Bearer` header). Each socket joins
//* the room `user:<id>`, so server code can push to a user with `emitToUser`.
//* B3c registers chat events (message:send, message:new, typing, read) via `registerSocketHandler`.

export type AuthedSocket = Socket & { data: { user: IUser } };
type SocketHandler = (io: Server, socket: AuthedSocket) => void;

let io: Server | null = null;
const handlers: SocketHandler[] = [];

export const userRoom = (userId: string) => `user:${userId}`;

//* Add per-connection event handlers (call at module load, before or after init)
export const registerSocketHandler = (handler: SocketHandler) => {
  handlers.push(handler);
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers.authorization;
      const raw = (socket.handshake.auth?.token as string | undefined) || header;
      if (!raw) return next(new Error("Unauthorized"));
      const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
      socket.data.user = await resolveAccessToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const authed = socket as AuthedSocket;
    authed.join(userRoom(authed.data.user.id));
    for (const handler of handlers) {
      try {
        handler(io as Server, authed);
      } catch (err) {
        logger.error("socket handler failed", err);
      }
    }
  });

  return io;
};

//* The Socket.IO server, or null before initSocket (e.g. in scripts/tests)
export const getIO = () => io;

//* Push an event to every open socket of a user; no-op if sockets are not initialised
export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(userRoom(userId)).emit(event, payload);
};
