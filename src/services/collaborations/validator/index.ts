import { z, ZodType } from "zod";
import { CollaborationRequest } from "../../../model/collaboration-model";

export const collaborationPayloadSchema: ZodType<CollaborationRequest> =
  z.object({
    cartId: z.string().min(1).max(50),
    userId: z.string().min(1).max(50),
  });
