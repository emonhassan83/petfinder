import { AuthedSocket, registerSocketHandler, userRoom } from "./index";
import { conversationService } from "../app/modules/conversation/conversation.service";
import { MESSAGE_MAX_LENGTH } from "../app/modules/conversation/conversation.constant";
import { logger } from "../shared/logger";

//* Chat socket events (registered at import; server.ts imports this file once).
//*   client -> server: message:send {conversationId, body} (ack), typing {conversationId, isTyping}, read {conversationId} (ack)
//*   server -> client: message:new <Message>, typing {conversationId, userId, isTyping}, read {conversationId, userId, readAt}
//* Every event re-checks conversation membership in the database. Rate limits are per socket.

type Ack = (res: { ok: boolean; message?: unknown; error?: string }) => void;

//* Sliding-window limiter: `limit` events per `windowMs`
const makeLimiter = (limit: number, windowMs: number) => {
  let stamps: number[] = [];
  return () => {
    const now = Date.now();
    stamps = stamps.filter((t) => now - t < windowMs);
    if (stamps.length >= limit) return false;
    stamps.push(now);
    return true;
  };
};

const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64;
const errMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");
const noop: Ack = () => undefined;

registerSocketHandler((io, socket: AuthedSocket) => {
  const user = socket.data.user;
  const allowMessage = makeLimiter(10, 10_000);
  const allowSignal = makeLimiter(40, 10_000);

  socket.on("message:send", async (payload: any, ack?: Ack) => {
    const reply = typeof ack === "function" ? ack : noop;
    try {
      if (!allowMessage()) return reply({ ok: false, error: "You are sending messages too fast" });
      if (!isId(payload?.conversationId) || typeof payload?.body !== "string") {
        return reply({ ok: false, error: "Invalid payload" });
      }
      if (payload.body.length > MESSAGE_MAX_LENGTH * 2) return reply({ ok: false, error: "Message too long" });
      const message = await conversationService.sendMessage(user, payload.conversationId, payload.body);
      reply({ ok: true, message });
    } catch (err) {
      reply({ ok: false, error: errMessage(err) });
    }
  });

  socket.on("typing", async (payload: any) => {
    try {
      if (!allowSignal() || !isId(payload?.conversationId)) return;
      const others = await conversationService.getOtherParticipantIds(payload.conversationId, user);
      const event = { conversationId: payload.conversationId, userId: user.id, isTyping: payload.isTyping !== false };
      for (const id of others) io.to(userRoom(id)).emit("typing", event);
    } catch {
      //* Not a member or bad id: ignore silently
    }
  });

  socket.on("read", async (payload: any, ack?: Ack) => {
    const reply = typeof ack === "function" ? ack : noop;
    try {
      if (!allowSignal()) return reply({ ok: false, error: "Too many events" });
      if (!isId(payload?.conversationId)) return reply({ ok: false, error: "Invalid payload" });
      await conversationService.markRead(payload.conversationId, user);
      reply({ ok: true });
    } catch (err) {
      reply({ ok: false, error: errMessage(err) });
    }
  });

  socket.on("error", (err) => logger.error("socket error", err));
});
