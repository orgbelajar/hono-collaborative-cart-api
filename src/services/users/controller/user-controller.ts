import { Hono } from "hono";
import type { ApplicationVariables } from "../../../model/app-model";
import UserRepository from "../repositories/user-repositories";
// import { UserRepository } from "../repositories/new-user-repositories";
import { userPayloadSchema } from "../validator/schema";

export const userController = new Hono<{ Variables: ApplicationVariables }>();

userController.post("/api/user", async (c) => {
  const request = userPayloadSchema.parse(await c.req.json());

  const response = await UserRepository.registerUser(request);

  return c.json(
    {
      status: "success",
      message: "Pengguna berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

userController.get("/api/user/:id", async (c) => {
  const id = c.req.param("id");

  const response = await UserRepository.getUserById(id);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

userController.get("/api/users", async (c) => {
  const { username = "" } = c.req.query();

  const response = await UserRepository.getUsersByUsername(username);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});
