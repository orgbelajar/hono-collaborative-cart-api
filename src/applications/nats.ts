import { connect, type NatsConnection } from "@nats-io/transport-node";
import {
  jetstream,
  jetstreamManager,
  RetentionPolicy,
  type JetStreamClient,
  type JetStreamManager,
} from "@nats-io/jetstream";
import { logger } from "./logging";

let natsConnection: NatsConnection;
let jetStreamClient: JetStreamClient;
let jetStreamManager: JetStreamManager;

export async function connectNats(): Promise<void> {
  const natsUrl = process.env.NATS_URL || "nats://localhost:4222";

  natsConnection = await connect({ servers: natsUrl });

  jetStreamManager = await jetstreamManager(natsConnection);
  jetStreamClient = jetstream(natsConnection);

  // Buat stream untuk export jika belum ada
  try {
    await jetStreamManager.streams.add({
      name: "EXPORT",
      subjects: ["export.>"],
      // Pesan disimpan sampai di-ack oleh consumer
      retention: RetentionPolicy.Workqueue,
    });
    logger.info(
      "NATS JetStream stream 'EXPORT' berhasil dibuat atau sudah ada",
    );
  } catch (error: unknown) {
    // Stream sudah ada, update saja
    if (error instanceof Error && error.message?.includes("already in use")) {
      logger.info("NATS JetStream stream 'EXPORT' sudah ada");
    } else {
      throw error;
    }
  }

  logger.info(`Terhubung ke NATS server di ${natsUrl}`);
}

export function getJetStreamClient(): JetStreamClient {
  if (!jetStreamClient) {
    throw new Error(
      "JetStream belum tersedia. Panggil connectNats() terlebih dahulu.",
    );
  }
  return jetStreamClient;
}

export async function closeNats(): Promise<void> {
  if (natsConnection) {
    await natsConnection.drain();
    logger.info("Koneksi NATS ditutup");
  }
}
