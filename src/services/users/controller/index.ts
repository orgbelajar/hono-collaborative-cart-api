import { Hono } from "hono";
import { RegisterUserRequest } from "../../../model/user-model";
import { UserRepository } from "../repositories/index";


export const userController = new Hono();

userController.post("/api/users", async (c) => {
  const request = (await c.req.json()) as RegisterUserRequest;

  const response = await UserRepository.registerUser(request);

  return c.json({
    data: response,
  });
});
