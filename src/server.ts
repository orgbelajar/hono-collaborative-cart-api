import { logger } from "./applications/logging";
import { closeNats, connectNats } from "./applications/nats";
import app from "./server/index";

const host = process.env.HOST;
const port = Number(process.env.PORT) || 3000;

// Inisialisasi koneksi NATS untuk pubslisher
connectNats().catch((error) => {
  logger.error(`Gagal menginisialisasi NATS: ${(error as Error).message}`);
});

const shutdown = async () => {
  await closeNats();
  process.exit(0);
};

// Tangkap sinyal Ctrl+C dari terminal untuk graceful shutdown
process.on("SIGINT", shutdown);
// Tangkap sinyal stop dari OS/Docker/PM2 untuk graceful shutdown
process.on("SIGTERM", shutdown);

export default {
  hostname: host,
  port: port,
  fetch: app.fetch,
};
