import { type ZodType, z } from "zod";
import type { RefreshTokenRequest } from "../../../model/auth-model";
import type { VerifyUserCredentialRequest } from "../../../model/user-model";

export const refreshTokenPayloadSchema: ZodType<RefreshTokenRequest> = z.object({
  token: z.string().nonempty(),
});

export const verifyUserCredentialPayloadSchema: ZodType<VerifyUserCredentialRequest> = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(100),
});
