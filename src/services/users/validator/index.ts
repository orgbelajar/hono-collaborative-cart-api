import { z, ZodType } from "zod";
import { RegisterUserRequest } from "../../../model/user-model";

export class UserValidation {
  static readonly REGISTER: ZodType<RegisterUserRequest> = z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(1).max(100),
    fullname: z.string().min(1).max(100),
  });

  // static readonly LOGIN: ZodType = z.object({
  //     username: z.string().min(1).max(100),
  //     password: z.string().min(1).max(100)
  // })

  // static readonly TOKEN: ZodType = z.string().min(1)

  // static readonly UPDATE: ZodType = z.object({
  //     password: z.string().min(1).max(100).optional(),
  //     name: z.string().min(1).max(100).optional(),
  // })
}
