import { prisma } from "../../../applications/database";
import {
  RegisterUserRequest,
  UserResponse,
  toUserResponse,
} from "../../../model/user-model";
import { UserValidation } from "../validator";
import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";

export class UserRepository {
  static async registerUser(
    request: RegisterUserRequest,
  ): Promise<UserResponse> {
    request = UserValidation.REGISTER.parse(request);

    const totalUserWithSameUsername = await prisma.user.count({
      where: {
        username: request.username,
      },
    });

    if (totalUserWithSameUsername != 0) {
      throw new HTTPException(400, {
        message: "Username already exists",
      });
    }

    const id = `user-${nanoid(17)}`;

    request.password = await Bun.password.hash(request.password, {
      algorithm: "bcrypt",
      cost: 10,
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
