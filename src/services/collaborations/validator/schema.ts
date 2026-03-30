import { type ZodType, z } from "zod";
import type { CollaborationRequest } from "../../../model/collaboration-model";

export const collaborationPayloadSchema: ZodType<CollaborationRequest> = z.object({
  cartId: z.string().min(1).max(50),
  userId: z.string().min(1).max(50),
});
