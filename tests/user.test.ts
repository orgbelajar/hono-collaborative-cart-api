import { describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Users API", () => {
  it("GET / should return Hello Hono!", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello Hono!");
  });

  const randomUsername = `testuser_${Math.random().toString(36).substring(7)}`;
  const testPassword = "password123";
  let userId: string;

  it("POST /api/user should register a new user", async () => {
    const res = await app.request("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: randomUsername,
        password: testPassword,
        fullname: "Test User Automatis",
      }),
    });

    expect(res.status).toBe(201); // Created
    const body = await res.json();
    userId = body.data.id;
    expect(body.status).toBe("success");
    expect(body.data.username).toBe(randomUsername);
  });

  it("GET /api/user/:id should return user details", async () => {
    const res = await app.request(`/api/user/${userId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.username).toBe(randomUsername);
  });

  it("GET /api/users should return searched users", async () => {
    const res = await app.request(`/api/users?username=${randomUsername}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((u: any) => u.username === randomUsername)).toBe(true);
  });

  it("POST /api/authentication should login and return tokens", async () => {
    const res = await app.request("/api/authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: randomUsername,
        password: testPassword,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });
});
