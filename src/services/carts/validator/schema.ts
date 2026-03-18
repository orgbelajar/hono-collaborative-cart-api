import { type ZodType, z } from "zod";
import type {
  AddCartPayload,
  AddProductToCartRequest,
  DeleteProductFromCartPayload,
} from "../../../model/cart-model";

export const addCartPayloadSchema: ZodType<AddCartPayload> = z.object({
  name: z.string().min(1).max(100),
});

export const addProductToCartPayloadSchema: ZodType<AddProductToCartRequest> =
  z.object({
    productId: z.string().min(1).max(50),
    qty: z.number().int().min(1),
  });

export const deleteProductFromCartPayloadSchema: ZodType<DeleteProductFromCartPayload> =
  z.object({
    productId: z.string().min(1).max(50),
  });
