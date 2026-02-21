import { nanoid } from "nanoid";
import { prisma } from "../src/applications/database";

export class UserTest {
  static async create() {
    await prisma.user.create({
      data: {
        id: `user-${nanoid(17)}`,
        username: "test",
        fullname: "test",
        password: await Bun.password.hash("test", {
          algorithm: "argon2id",
          memoryCost: 19456,
          timeCost: 2,
        }),
      },
    });
  }
}
