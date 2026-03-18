import { type ZodType, z } from "zod";
import type { ExportOrderRequest } from "../../../model/export-model";

export const exportOrderPayloadSchema: ZodType<ExportOrderRequest> = z.object({
  cartId: z.string().min(1).max(100),
  targetEmail: z.email().nonempty(),
});
