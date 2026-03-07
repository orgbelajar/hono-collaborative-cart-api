import { prisma } from "../../../applications/database";
import InvariantError from "../../../exceptions/invariant-error";
import { RefreshTokenRequest } from "../../../model/auth-model";

export default class AuthenticationRepository {
  static async addRefreshToken(request: RefreshTokenRequest): Promise<void> {
    const result = await prisma.authentication.findUnique({
      where: {
        token: request.token,
      },
    });

    if (result) {
      throw new InvariantError("Refresh token sudah ada");
    }

    await prisma.authentication.create({ data: { token: request.token } });
  }

  static async verifyRefreshToken(request: RefreshTokenRequest): Promise<void> {
    const result = await prisma.authentication.findUnique({
      where: {
        token: request.token,
      },
    });

    if (!result) {
      throw new InvariantError("Refresh token tidak valid");
    }
  }

  static async deleteRefreshToken(request: RefreshTokenRequest): Promise<void> {
    await prisma.authentication.delete({
      where: {
        token: request.token,
      },
    });
  }
}
