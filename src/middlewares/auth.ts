import { MiddlewareHandler } from "hono";
import TokenManager from "../security/token-manager";
// import { verify } from "hono/jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization");

  if (token && token.indexOf("Bearer ") !== -1) {
    try {
      const user = await TokenManager.verifyAccessToken(
        token.split("Bearer ")[1],
      );
      c.set("user", user); // contain user id example "user-9pW6MNVi_7wgGI2js"
      await next();
      return;
    } catch (error) {
      return c.json({ message: (error as Error).message }, 401);
    }
  }

  return c.json({ message: "Unauthorized" }, 401);
};
