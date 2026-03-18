import { beforeAll, describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Collaborations API", () => {
  let ownerToken: string;
  let collaboratorUserId: string;
  let cartId: string;
  const ownerUsername = `owner_${Math.random().toString(36).substring(7)}`;
  const collabUsername = `collab_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // 1. Registrasi Owner & Login
    await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ownerUsername,
        password: "password123",
        fullname: "Owner User",
      }),
    });
    const loginRes = await app.request("/api/authentication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ownerUsername,
        password: "password123",
      }),
    });
    const loginBody = await loginRes.json();
    ownerToken = loginBody.data.accessToken;

    // 2. Registrasi Collaborator
    const collabRes = await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: collabUsername,
        password: "password123",
        fullname: "Collab User",
      }),
    });
    const collabBody = await collabRes.json();
    collaboratorUserId = collabBody.data.id;

    // 3. Buat Cart
    const cartRes = await app.request("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name: "Keranjang Kolaborasi" }),
    });
    const cartBody = await cartRes.json();
    cartId = cartBody.data.id;
  });

  it("POST /api/collaborations should add collaborator", async () => {
    const res = await app.request("/api/collaborations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cartId: cartId,
        userId: collaboratorUserId,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toContain("berhasil ditambahkan");
  });

  it("DELETE /api/collaborations should remove collaborator", async () => {
    const res = await app.request("/api/collaborations", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        cartId: cartId,
        userId: collaboratorUserId,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toContain("berhasil dihapus");
  });
});
