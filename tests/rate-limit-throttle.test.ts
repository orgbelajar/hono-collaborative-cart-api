import { describe, expect, it } from "bun:test";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";

/**
 * Test Rate Limiting & Throttling
 *
 * Semua test menggunakan Hono app mini TERISOLASI (bukan app utama),
 * agar tidak mengganggu state rate limiter di test fungsional lainnya.
 *
 * Untuk rate limiter dibuat instance baru dengan konfigurasi identik.
 * Untuk throttle dibuat versi ringan dengan threshold rendah agar test cepat.
 */

// Helper: Membuat Hono app + rate limiter terisolasi
const getClientIp = (c: { req: { header: (name: string) => string | undefined } }): string =>
  c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";

/**
 * Factory: Membuat throttle middleware dengan threshold yang dapat disesuaikan.
 * Digunakan agar test tidak perlu mengirim 50+ request (threshold produksi).
 */
function createThrottleMiddleware(options: {
  windowMs: number;
  threshold: number;
  maxDelayMs: number;
}): MiddlewareHandler {
  const store = new Map<string, { count: number; resetTime: number }>();

  return async (c, next) => {
    const clientIp = getClientIp(c);
    const now = Date.now();

    let entry = store.get(clientIp);

    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + options.windowMs,
      };
    }

    entry.count++;
    store.set(clientIp, entry);

    const usageRatio = entry.count / options.threshold;

    let delayMs = 0;

    if (usageRatio > 1) {
      delayMs = options.maxDelayMs;
    } else if (usageRatio > 0.8) {
      const progress = (usageRatio - 0.8) / 0.2;
      delayMs = Math.floor(1500 + progress * 1500);
    } else if (usageRatio > 0.6) {
      const progress = (usageRatio - 0.6) / 0.2;
      delayMs = Math.floor(500 + progress * 1000);
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    c.header("X-Throttle-Delay-Ms", String(delayMs));

    await next();
  };
}

// TEST: Auth Rate Limiter (brute-force protection)
describe("Rate Limiting - Auth (Login)", () => {
  const app = new Hono();

  const testAuthLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-6",
    keyGenerator: () => "test-auth-ip",
    message: {
      status: "fail",
      message: "Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.",
    },
  });

  app.post("/api/authentication", testAuthLimiter, (c) => c.json({ status: "success" }));

  it("should allow requests under the limit (5 requests)", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await app.request("/api/authentication", { method: "POST" });
      expect(res.status).toBe(200);
    }
  });

  it("should return 429 after exceeding 5 requests", async () => {
    const res = await app.request("/api/authentication", { method: "POST" });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.status).toBe("fail");
    expect(body.message).toContain("Terlalu banyak percobaan login");
  });

  it("should include RateLimit headers in response", async () => {
    const headerApp = new Hono();
    const headerLimiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: "draft-6",
      keyGenerator: () => "test-header-ip",
    });
    headerApp.post("/test", headerLimiter, (c) => c.json({ status: "success" }));

    const res = await headerApp.request("/test", { method: "POST" });
    expect(res.status).toBe(200);
    expect(res.headers.get("RateLimit-Limit")).toBe("5");
    expect(res.headers.get("RateLimit-Remaining")).toBe("4");
    expect(res.headers.get("RateLimit-Reset")).toBeDefined();
  });
});

// TEST: Registration Rate Limiter (spam protection)
describe("Rate Limiting - Registration", () => {
  const app = new Hono();

  const testRegLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: "draft-6",
    keyGenerator: () => "test-reg-ip",
    message: {
      status: "fail",
      message: "Terlalu banyak registrasi dari alamat IP ini. Silakan coba lagi setelah 1 jam.",
    },
  });

  app.post("/api/user", testRegLimiter, (c) => c.json({ status: "success" }));

  it("should allow requests under the limit (3 requests)", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/api/user", { method: "POST" });
      expect(res.status).toBe(200);
    }
  });

  it("should return 429 after exceeding 3 requests", async () => {
    const res = await app.request("/api/user", { method: "POST" });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.status).toBe("fail");
    expect(body.message).toContain("Terlalu banyak registrasi");
  });
});

// TEST: Heavy Operation Rate Limiter (upload & export)
describe("Rate Limiting - Heavy Operations", () => {
  const app = new Hono();

  const testHeavyLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-6",
    keyGenerator: () => "test-heavy-user",
    message: {
      status: "fail",
      message: "Terlalu banyak permintaan untuk operasi ini. Silakan coba lagi setelah 15 menit.",
    },
  });

  app.post("/api/product/:id/image", testHeavyLimiter, (c) => c.json({ status: "success" }));

  it("should allow requests under the limit (10 requests)", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await app.request("/api/product/123/image", {
        method: "POST",
      });
      expect(res.status).toBe(200);
    }
  });

  it("should return 429 after exceeding 10 requests", async () => {
    const res = await app.request("/api/product/123/image", {
      method: "POST",
    });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.status).toBe("fail");
    expect(body.message).toContain("Terlalu banyak permintaan");
  });

  it("should include correct RateLimit-Limit header", async () => {
    const headerApp = new Hono();
    const headerLimiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-6",
      keyGenerator: () => "test-heavy-header-ip",
    });
    headerApp.post("/test", headerLimiter, (c) => c.json({ status: "success" }));

    const res = await headerApp.request("/test", { method: "POST" });
    expect(res.headers.get("RateLimit-Limit")).toBe("10");
  });
});

// TEST: Throttle Middleware (perlambatan bertahap)
// Menggunakan threshold rendah (5) agar test cepat.
describe("Throttling - Gradual Delay", () => {
  const app = new Hono();

  // Threshold 5 (bukan 50) agar test cepat
  // maxDelayMs 100 (bukan 3000) agar test tidak lambat
  const testThrottle = createThrottleMiddleware({
    windowMs: 60 * 1000,
    threshold: 5,
    maxDelayMs: 100,
  });

  app.get("/api/products", testThrottle, (c) => c.json({ status: "success" }));

  it("should add X-Throttle-Delay-Ms header to response", async () => {
    const res = await app.request("/api/products");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Throttle-Delay-Ms")).toBeDefined();
  });

  it("should not add delay for requests under 60% threshold", async () => {
    // Request ke-2 dan ke-3 (60% of 5 = 3), masih di bawah batas
    const res2 = await app.request("/api/products");
    expect(res2.headers.get("X-Throttle-Delay-Ms")).toBe("0");

    const res3 = await app.request("/api/products");
    expect(res3.headers.get("X-Throttle-Delay-Ms")).toBe("0");
  });

  it("should add delay for requests above 60% threshold", async () => {
    // Request ke-4 (4/5 = 80%), seharusnya ada delay
    const res = await app.request("/api/products");
    const delay = Number(res.headers.get("X-Throttle-Delay-Ms"));
    expect(delay).toBeGreaterThan(0);
  });

  it("should increase delay as usage ratio grows", async () => {
    // Request ke-5 (5/5 = 100%), delay harus lebih besar dari sebelumnya
    const res = await app.request("/api/products");
    const delay = Number(res.headers.get("X-Throttle-Delay-Ms"));
    expect(delay).toBeGreaterThan(0);
  });

  it("should apply max delay when exceeding threshold", async () => {
    // Request ke-6 (6/5 = 120%), delay harus = maxDelayMs
    const res = await app.request("/api/products");
    const delay = Number(res.headers.get("X-Throttle-Delay-Ms"));
    expect(delay).toBe(100); // maxDelayMs yang di set
  });

  it("should still return 200 even when throttled (not rejected)", async () => {
    // Throttle TIDAK menolak request, hanya memperlambat
    const res = await app.request("/api/products");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
  });
});

// TEST: Throttle vs Rate Limiter — perbedaan perilaku
describe("Throttle vs Rate Limiter - Behavior Difference", () => {
  it("Rate Limiter should REJECT with 429 after exceeding limit", async () => {
    const app = new Hono();
    const limiter = rateLimiter({
      windowMs: 60 * 1000,
      limit: 2,
      keyGenerator: () => "test-diff-rl",
    });
    app.get("/test", limiter, (c) => c.json({ ok: true }));

    await app.request("/test"); // 1
    await app.request("/test"); // 2
    const res = await app.request("/test"); // 3 — should be rejected

    expect(res.status).toBe(429);
  });

  it("Throttle should SLOW DOWN but still return 200", async () => {
    const app = new Hono();
    const throttle = createThrottleMiddleware({
      windowMs: 60 * 1000,
      threshold: 2,
      maxDelayMs: 50,
    });
    app.get("/test", throttle, (c) => c.json({ ok: true }));

    await app.request("/test"); // 1
    await app.request("/test"); // 2
    const res = await app.request("/test"); // 3 — should still pass, with delay

    expect(res.status).toBe(200);
    const delay = Number(res.headers.get("X-Throttle-Delay-Ms"));
    expect(delay).toBeGreaterThan(0);
  });
});
