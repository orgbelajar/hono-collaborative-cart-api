import { Hono } from "hono";
import { AuthenticationRepository } from "../repositories/index";
import { verifyUserCredentialPayloadSchema } from "../validator/index";
import { UserRepository } from "../../users/repositories";
import TokenManager from "../../../security/token-manager";
import { refreshTokenPayloadSchema } from "../validator/index";

export const authenticationController = new Hono();

authenticationController.post("/api/authentications", async (c) => {
  const request = verifyUserCredentialPayloadSchema.parse(await c.req.json());

  const userId = await UserRepository.verifyUserCredential(request);

  const accessToken = await TokenManager.generateAccessToken({ id: userId });
  const refreshToken = await TokenManager.generateRefreshToken({ id: userId });

  await AuthenticationRepository.addRefreshToken(refreshToken);
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

  await AuthenticationRepository.verifyRefreshToken(request.token);

  const { id } = await TokenManager.verifyRefreshToken(request.token);
  const accessToken = await TokenManager.generateAccessToken({ id });

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

  await AuthenticationRepository.verifyRefreshToken(request.token);

  await AuthenticationRepository.deleteRefreshToken(request.token);

  return c.json(
    {
      status: "success",
      message: "Refresh Token berhasil dihapus",
    },
    200,
  );
});
