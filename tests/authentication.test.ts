import { beforeAll, describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Authentications API", () => {
  const testUsername = `authuser_${Math.random().toString(36).substring(7)}`;
  const testPassword = "password123";
  let refreshToken: string;

  beforeAll(async () => {
    // Registrasi User
    await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
        fullname: "Auth Tester",
      }),
    });
  });

  it("POST /api/authentication should login and return tokens", async () => {
    const res = await app.request("/api/authentication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: testPassword,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    refreshToken = body.data.refreshToken;
  });

  it("PUT /api/authentication should refresh access token", async () => {
    const res = await app.request("/api/authentication", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: refreshToken,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.accessToken).toBeDefined();
    expect(body.message).toBe("Akses Token berhasil diperbarui");
  });

  it("DELETE /api/authentication should logout", async () => {
    const res = await app.request("/api/authentication", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: refreshToken,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("Refresh Token berhasil dihapus");
  });

  it("PUT /api/authentication should fail with deleted refresh token", async () => {
    const res = await app.request("/api/authentication", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: refreshToken,
      }),
    });

    // InvariantError should return 400 (Client Error)
    expect(res.status).toBe(400);
  });
});
