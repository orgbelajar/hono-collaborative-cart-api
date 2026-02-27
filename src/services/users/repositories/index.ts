import { prisma } from "../../../applications/database";
import {
  RegisterUserRequest,
  UserResponse,
  toUserResponse,
  VerifyUsernameRequest,
} from "../../../model/user-model";
import { VerifyUserCredentialRequest } from "../../../model/auth-model";
import { nanoid } from "nanoid";
import {
  InvariantError,
  NotFoundError,
  AuthenticationError,
} from "../../../exceptions/index";

export class UserRepository {
  static async registerUser(
    request: RegisterUserRequest,
  ): Promise<UserResponse> {
    await this.verifyNewUsername(request);

    const id = `user-${nanoid(17)}`;

    request.password = await Bun.password.hash(request.password, {
      algorithm: "argon2id",
      memoryCost: 19456,
      timeCost: 2,
    });

    const user = await prisma.user.create({
      data: {
        id,
        ...request,
      },
    });

    return toUserResponse(user);
  }

  static async verifyNewUsername(
    request: VerifyUsernameRequest,
  ): Promise<void> {
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

  static async getUserById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    return toUserResponse(user);
  }

  static async verifyUserCredential(
    request: VerifyUserCredentialRequest,
  ): Promise<{ id: string; username: string }> {
    const user = await prisma.user.findUnique({
      where: {
        username: request.username,
      },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Kredensial yang anda diberikan salah");
    }

    const { id, username, password: hashedPassword } = user;

    const isPasswordValid = await Bun.password.verify(
      request.password,
      hashedPassword,
    );

    if (!isPasswordValid) {
      throw new InvariantError("Password yang anda berikan salah");
    }

    return { id, username };
  }

  static async getUsersByUsername(username: string): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
        },
      },
    });

    return users.map((user) => toUserResponse(user));
  }
}
