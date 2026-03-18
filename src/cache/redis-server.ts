import { Redis } from "ioredis";
import config from "../utils/config";

class CacheService {
  private client: Redis;

  constructor() {
    // Connect to Redis
    this.client = new Redis({
      host: config.redis.host,
    });

    this.client.on("error", (err) => {
      console.error(err);
    });
  }

  async set(key: string, value: string, expirationInSecond: number = 1800) {
    await this.client.set(key, value, "EX", expirationInSecond);
  }

  async get(key: string) {
    const result = await this.client.get(key);

    if (result === null) {
      throw new Error("Cache tidak ditemukan");
    }

    return result;
  }

  delete(key: string) {
    this.client.del(key);
  }
}

export default new CacheService();
