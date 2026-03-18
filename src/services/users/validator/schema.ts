import { type ZodType, z } from "zod";
import type { RegisterUserRequest } from "../../../model/user-model";

export const userPayloadSchema: ZodType<RegisterUserRequest> = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
  fullname: z.string().min(1).max(100),
});
