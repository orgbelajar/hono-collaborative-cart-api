import app from "./server/index";
import { closeNats, connectNats } from "./applications/nats";
import { logger } from "./applications/logging";

const host = process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

// Inisialisasi koneksi NATS untuk pubslisher
connectNats().catch((error) => {
  logger.error(`Gagal menginisialisasi NATS: ${(error as Error).message}`);
});

const shutdown = async () => {
  await closeNats();
  process.exit(0);
};
  
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default {
  hostname: host,
  port: port,
  fetch: app.fetch,
};
