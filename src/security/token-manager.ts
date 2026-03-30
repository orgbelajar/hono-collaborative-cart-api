import { sign, verify } from "hono/jwt";
import InvariantError from "../exceptions/invariant-error";
import config from "../utils/config";

const TokenManager = {
  generateAccessToken: (payload: Record<string, unknown>) => {
    const now = Math.floor(Date.now() / 1000);
    const expiredAt = now + 60 * 60 * 3;
    return sign({ ...payload, iat: now, exp: expiredAt }, config.jwt.access_token_key!);
  },
  generateRefreshToken: (payload: Record<string, unknown>) => {
    const now = Math.floor(Date.now() / 1000);
    const expiredAt = now + 60 * 60 * 24 * 7;
    return sign({ ...payload, iat: now, exp: expiredAt }, config.jwt.refresh_token_key!);
  },
  verifyAccessToken: async (accessToken: string) => {
    try {
      const payload = await verify(accessToken, config.jwt.access_token_key!, "HS256");
      return payload; // mengembalikan payload yang berisi user id dan username
    } catch (error) {
      console.log(error);
      throw new InvariantError("Access token tidak valid atau sudah kedaluwarsa!");
    }
  },
  verifyRefreshToken: async (refreshToken: string) => {
    try {
      const payload = await verify(refreshToken, config.jwt.refresh_token_key!, "HS256");
      return payload; //
    } catch (error) {
      console.log(error);
      throw new InvariantError("Refresh token tidak valid atau sudah kedaluwarsa!");
    }
  },
};

export default TokenManager;
