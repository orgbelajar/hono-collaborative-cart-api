import { Hono } from "hono";
import { UserRepository } from "../repositories/index";
import { userPayloadSchema } from "../validator/index";

export const userController = new Hono();

userController.post("/api/users", async (c) => {
  const request = userPayloadSchema.parse(await c.req.json());

  const response = await UserRepository.registerUser(request);

  return c.json(
    {
      status: "success",
      message: "User berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

userController.get("/api/users/:id", async (c) => {
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
