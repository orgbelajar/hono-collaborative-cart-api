import type { MiddlewareHandler } from "hono";
import TokenManager from "../security/token-manager";
// import { verify } from "hono/jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization");

  if (token && token.indexOf("Bearer ") !== -1) {
    try {
      const user = await TokenManager.verifyAccessToken(token.split("Bearer ")[1]);
      // Bila verifikasi berhasil, payload token (misalnya data user) akan disimpan di context
      c.set("user", user); // contain id & username user
      await next();
      return;
    } catch (error) {
      return c.json({ message: (error as Error).message }, 401);
    }
  }

  //  Bila verifikasi gagal atau token tidak ditemukan, server akan langsung menolak request dengan status 401 Unauthorized.
  return c.json({ message: "Unauthorized" }, 401);
};
