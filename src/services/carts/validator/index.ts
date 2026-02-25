import { z, ZodType } from "zod";
import {
  AddCartRequest,
  AddProductToCartRequest,
} from "../../../model/cart-model";

export const addCartPayloadSchema: ZodType<AddCartRequest> = z.object({
  name: z.string().min(1).max(100),
});

export const addProductToCartPayloadSchema: ZodType<AddProductToCartRequest> =
  z.object({
    productId: z.string().min(1).max(50),
    qty: z.number().int().min(1),
  });
