import type { MiddlewareHandler } from "hono";

/**
 * Helper: mengambil identifier IP dari request header.
 * Menggunakan x-forwarded-for (reverse proxy) → x-real-ip → fallback "anonymous".
 */
const getClientIp = (c: { req: { header: (name: string) => string | undefined } }): string =>
  c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";

/**
 * Konfigurasi throttle
 */
const THROTTLE_WINDOW_MS = 60 * 1000; // 1 menit
const THROTTLE_THRESHOLD = 50; // Jumlah request per window sebelum delay maksimal
const THROTTLE_MAX_DELAY_MS = 3000; // Delay maksimal 3 detik
const THROTTLE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Bersihkan entry expired setiap 5 menit

/**
 * Tracking data per client IP.
 */
interface ThrottleEntry {
  count: number;
  resetTime: number;
}

const throttleStore = new Map<string, ThrottleEntry>();

/**
 * Pembersihan otomatis entry yang sudah expired dari Map.
 * Mencegah memory leak untuk server yang berjalan lama.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(throttleStore.entries())) {
    if (now >= entry.resetTime) {
      throttleStore.delete(key);
    }
  }
}, THROTTLE_CLEANUP_INTERVAL_MS);

/**
 * Throttle middleware untuk endpoint GET publik.
 * Memperlambat request secara bertahap berdasarkan persentase penggunaan:
 * - ≤60%  : tidak ada delay (normal)
 * - 60-80%: delay 500ms – 1500ms (mulai melambat)
 * - 80-100%: delay 1500ms – 3000ms (sangat lambat)
 * - >100% : delay tetap 3000ms (maksimal, tapi tetap diproses)
 *
 * Menambahkan header X-Throttle-Delay-Ms di response.
 */
export const throttleMiddleware: MiddlewareHandler = async (c, next) => {
  // Skip throttling saat menjalankan test (NODE_ENV=test).
  // Throttle memiliki test terisolasi sendiri di rate-limit-throttle.test.ts.
  if (process.env.NODE_ENV === "test") {
    await next();
    return;
  }

  const clientIp = getClientIp(c);
  const now = Date.now();

  // Ambil atau buat entry baru untuk client IP ini
  let entry = throttleStore.get(clientIp);

  if (!entry || now >= entry.resetTime) {
    // Window sudah expired atau belum ada entry — reset
    entry = {
      count: 0,
      resetTime: now + THROTTLE_WINDOW_MS,
    };
  }

  // Increment counter
  entry.count++;
  throttleStore.set(clientIp, entry);

  // Hitung persentase penggunaan dari threshold
  const usageRatio = entry.count / THROTTLE_THRESHOLD;

  let delayMs = 0;

  if (usageRatio > 1) {
    // Melebihi threshold — delay maksimal
    delayMs = THROTTLE_MAX_DELAY_MS;
  } else if (usageRatio > 0.8) {
    // 80%-100% — delay 1500ms sampai 3000ms
    const progress = (usageRatio - 0.8) / 0.2; // 0 → 1
    delayMs = Math.floor(1500 + progress * 1500);
  } else if (usageRatio > 0.6) {
    // 60%-80% — delay 500ms sampai 1500ms
    const progress = (usageRatio - 0.6) / 0.2; // 0 → 1
    delayMs = Math.floor(500 + progress * 1000);
  }

  // Terapkan delay jika ada
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Tambahkan header informasi throttle di response
  c.header("X-Throttle-Delay-Ms", String(delayMs));

  await next();
};
