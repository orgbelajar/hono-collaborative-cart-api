import { logger } from "../../../applications/logging";
import { getJetStreamClient } from "../../../applications/nats";
import type { ExportOrderMessage } from "../../../model/export-model";

export const ExportService = {
  async sendMessage(queue: string, message: ExportOrderMessage): Promise<void> {
    const js = getJetStreamClient();

    await js.publish(queue, JSON.stringify(message));

    logger.info(
      `Pesan export order untuk cart ${message.cartId} telah dipublikasikan ke NATS`,
    );
  },
};
