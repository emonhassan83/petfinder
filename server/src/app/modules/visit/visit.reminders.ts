import { logger } from "../../../shared/logger";
import { VisitService } from "./visit.service";

const INTERVAL_MS = 10 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

//* Sends one reminder per confirmed visit starting within 24 h (reminderSentAt prevents repeats).
//* Call once from server.ts after the server starts. Returns a stop function.
export const startVisitReminders = () => {
  if (timer) return () => undefined;
  const run = () => VisitService.sendDueReminders().catch((err) => logger.error("visit reminder run failed", err));
  run();
  timer = setInterval(run, INTERVAL_MS);
  timer.unref();
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
};
