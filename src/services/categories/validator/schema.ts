import { type ZodType, z } from "zod";
import type { CategoryRequest } from "../../../model/category-model";

export const categoryPayloadSchema: ZodType<CategoryRequest> = z.object({
  name: z.string().min(1).max(100),
});
