import { rateLimiter } from "hono-rate-limiter";

/**
 * Helper: mengambil identifier IP dari request header.
 * Menggunakan x-forwarded-for (reverse proxy) → x-real-ip → fallback "anonymous".
 */
const getClientIp = (c: { req: { header: (name: string) => string | undefined } }): string =>
  c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";

/**
 * Skip rate limiting saat menjalankan test (NODE_ENV=test).
 * Rate limiter memiliki test terisolasi sendiri di rate-limit-throttle.test.ts.
 */
const isTestEnv = () => process.env.NODE_ENV === "test";

/**
 * Rate limiter untuk endpoint login (POST /api/authentication).
 * Perlindungan terhadap brute-force attack.
 * - 5 request per 15 menit per IP
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 5,
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIp(c),
  skip: isTestEnv,
  message: {
    status: "fail",
    message: "Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.",
  },
});

/**
 * Rate limiter untuk endpoint registrasi (POST /api/user).
 * Pencegahan spam pembuatan akun.
 * - 3 request per 60 menit per IP
 */
export const registrationRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 60 menit
  limit: 3,
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIp(c),
  skip: isTestEnv,
  message: {
    status: "fail",
    message: "Terlalu banyak registrasi dari alamat IP ini. Silakan coba lagi setelah 1 jam.",
  },
});

/**
 * Rate limiter untuk operasi berat (upload gambar & export laporan).
 * Menggunakan Authorization header sebagai key agar limit per-user.
 * - 10 request per 15 menit per user/IP
 */
export const heavyOperationRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: (c) => c.req.header("Authorization") ?? getClientIp(c),
  skip: isTestEnv,
  message: {
    status: "fail",
    message: "Terlalu banyak permintaan untuk operasi ini. Silakan coba lagi setelah 15 menit.",
  },
});

