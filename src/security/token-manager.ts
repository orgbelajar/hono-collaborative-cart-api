import { sign, verify } from "hono/jwt";
import InvariantError from "../exceptions/invariant-error";

const TokenManager = {
  generateAccessToken: (payload: Record<string, unknown>) =>
    sign(payload, process.env.ACCESS_TOKEN_KEY!),
  generateRefreshToken: (payload: Record<string, unknown>) =>
    sign(payload, process.env.REFRESH_TOKEN_KEY!),
  verifyAccessToken: async (accessToken: string) => {
    try {
      const payload = await verify(
        accessToken,
        process.env.ACCESS_TOKEN_KEY!,
        "HS256",
      );
      return payload; 
    } catch (error) {
      console.log(error);
      throw new InvariantError("Access token tidak valid");
    }
  },
  verifyRefreshToken: async (refreshToken: string) => {
    try {
      const payload = await verify(
        refreshToken,
        process.env.REFRESH_TOKEN_KEY!,
        "HS256",
      );
      return payload; //
    } catch (error) {
      console.log(error);
      throw new InvariantError("Refresh token tidak valid");
    }
  },
};

export default TokenManager;
