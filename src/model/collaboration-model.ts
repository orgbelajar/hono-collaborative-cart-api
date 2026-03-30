import type { CartSharedUser } from "../../generated/prisma/client";

export type CollaborationRequest = {
  cartId: string;
  userId: string;
};

export type CollaborationResponse = {
  id: string;
  cartId: string;
  userId: string;
};

export function toCollaborationResponse(collaboration: CartSharedUser): CollaborationResponse {
  return {
    id: collaboration.id,
    cartId: collaboration.cartId,
    userId: collaboration.userId,
  };
}
