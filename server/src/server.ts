import http from "http";
import app from "./app";
import config from "./config";
import prisma from "./shared/prisma";
import { initSocket } from "./socket";
import { logger } from "./shared/logger";
import { startVisitReminders } from "./app/modules/visit/visit.reminders";
import "./socket/chat";
import "./app/modules/notification/notification.channels";

const server = http.createServer(app);
initSocket(server);

server.listen(config.port, () => {
  logger.info(`Petfinder server is ready at http://localhost:${config.port}`);
  startVisitReminders();
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection", reason));
