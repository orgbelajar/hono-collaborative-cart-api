import { z, ZodType } from "zod";
import {
  AddProductRequest,
  EditProductRequest,
} from "../../../model/product-model";

export const addProductPayloadSchema: ZodType<AddProductRequest> = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1).max(50),
});

export const editProductPayloadSchema: ZodType<EditProductRequest> = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().min(1).max(50).optional(),
});
