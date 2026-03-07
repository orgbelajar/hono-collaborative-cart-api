import { prisma } from "../../../applications/database";
import {
  RegisterUserRequest,
  UserResponse,
  toUserResponse,
  VerifyUsernameRequest,
  VerifyUserCredentialRequest,
} from "../../../model/user-model";
import { nanoid } from "nanoid";
import InvariantError from "../../../exceptions/invariant-error";
import NotFoundError from "../../../exceptions/not-found-error";
import AuthenticationError from "../../../exceptions/authentication-error";

class UserRepository {
  async verifyNewUsername(request: VerifyUsernameRequest): Promise<void> {
    const totalUserWithSameUsername = await prisma.user.count({
      where: {
        username: request.username,
      },
    });

    if (totalUserWithSameUsername != 0) {
      throw new InvariantError(
        "Username sudah terdaftar, mohon pilih username lain",
      );
    }
  }

  async registerUser(request: RegisterUserRequest): Promise<UserResponse> {
    await this.verifyNewUsername(request);

    const id = `user-${nanoid(17)}`;

    request.password = await Bun.password.hash(request.password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });

    const user = await prisma.user.create({
      data: {
        id,
        ...request,
      },
    });

    return toUserResponse(user);
  }
}

export default new UserRepository();
