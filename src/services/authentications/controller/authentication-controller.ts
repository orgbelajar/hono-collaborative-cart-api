import { Hono } from "hono";
import AuthenticationRepository from "../repositories/authentication-repositories";
import {
  verifyUserCredentialPayloadSchema,
  refreshTokenPayloadSchema,
} from "../validator/schema";
import UserRepository from "../../users/repositories/user-repositories";
import TokenManager from "../../../security/token-manager";

export const authenticationController = new Hono();

authenticationController.post("/api/authentications", async (c) => {
  const request = verifyUserCredentialPayloadSchema.parse(await c.req.json());

  const { id, username } = await UserRepository.verifyUserCredential(request);

  // Memberikan id dan username ke dalam token
  const accessToken = await TokenManager.generateAccessToken({ id, username });
  const refreshToken = await TokenManager.generateRefreshToken({
    id,
    username,
  });

  await AuthenticationRepository.addRefreshToken({ token: refreshToken });
  return c.json(
    {
      status: "success",
      message: "Authentication berhasil ditambahkan",
      data: {
        accessToken,
        refreshToken,
      },
    },
    201,
  );
});

authenticationController.put("/api/authentications", async (c) => {
  const request = refreshTokenPayloadSchema.parse(await c.req.json());

  // Cek refresh token di database
  await AuthenticationRepository.verifyRefreshToken(request);

  const { id, username } = await TokenManager.verifyRefreshToken(request.token);
  const accessToken = await TokenManager.generateAccessToken({ id, username });

  return c.json(
    {
      status: "success",
      message: "Akses Token berhasil diperbarui",
      data: {
        accessToken,
      },
    },
    200,
  );
});

authenticationController.delete("/api/authentications", async (c) => {
  const request = refreshTokenPayloadSchema.parse(await c.req.json());

  await AuthenticationRepository.verifyRefreshToken(request);
  await AuthenticationRepository.deleteRefreshToken(request);

  return c.json(
    {
      status: "success",
      message: "Refresh Token berhasil dihapus",
    },
    200,
  );
});
