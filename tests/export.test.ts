import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { closeNats, connectNats } from "../src/applications/nats";
import app from "../src/server/index";

describe("Exports API (NATS Message Trigger)", () => {
  let accessToken: string;
  let cartId: string;
  const targetEmail = "nabilsyakir95@gmail.com";
  const testUsername = `exportuser_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // 0. Inisialisasi NATS
    await connectNats();

    // 1. Setup User & Login
    await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: "password123",
        fullname: "Export Tester",
      }),
    });
    const loginRes = await app.request("/api/authentication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, password: "password123" }),
    });
    const loginBody = await loginRes.json();
    accessToken = loginBody.data.accessToken;

    // 2. Setup Cart
    const cartRes = await app.request("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: "Keranjang Ekspor" }),
    });
    const cartBody = await cartRes.json();
    cartId = cartBody.data.id;
  });

  afterAll(async () => {
    await closeNats();
  });

  it("POST /api/export/order/:cartId should trigger export (Auth Required)", async () => {
    const res = await app.request(`/api/export/order/${cartId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        cartId: cartId,
        targetEmail: targetEmail,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toContain("sedang diproses");
  });

  it("POST /api/export/order/:cartId should fail without Auth", async () => {
    const res = await app.request(`/api/export/order/${cartId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetEmail: targetEmail,
      }),
    });

    expect(res.status).toBe(401);
  });
});
