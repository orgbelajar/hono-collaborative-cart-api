import {
  type JetStreamClient,
  type JetStreamManager,
  jetstream,
  jetstreamManager,
  RetentionPolicy,
} from "@nats-io/jetstream";
import { connect, type NatsConnection } from "@nats-io/transport-node";
import config from "../utils/config";
import { logger } from "./logging";

let natsConnection: NatsConnection;
let jetStreamClient: JetStreamClient;
let jetStreamManager: JetStreamManager;

export async function connectNats(): Promise<void> {
  const natsUrl = config.nats.url;

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
    logger.info("NATS JetStream stream 'EXPORT' berhasil dibuat atau sudah ada");
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
    throw new Error("JetStream belum tersedia. Panggil connectNats() terlebih dahulu.");
  }
  return jetStreamClient;
}

export async function closeNats(): Promise<void> {
  if (natsConnection) {
    // Jangan lakukan apa pun jika koneksi sudah tertutup atau sedang proses menutup
    if (natsConnection.isClosed() || natsConnection.isDraining()) {
      return;
    }

    try {
      await natsConnection.drain();
      logger.info("Koneksi NATS ditutup");
    } catch (error) {
      // Abaikan error jika ternyata koneksi sudah mulai menutup di tengah jalan
      if (
        (error as Error).message?.includes("draining") ||
        (error as Error).message?.includes("closed")
      ) {
        return;
      }
      logger.error(`Error saat menutup koneksi NATS: ${(error as Error).message}`);
    }
  }
}
