import { nanoid } from "nanoid";
import type { User } from "../../../../generated/prisma/client";
import { prisma } from "../../../applications/database";
import InvariantError from "../../../exceptions/invariant-error";
import NotFoundError from "../../../exceptions/not-found-error";
import {
  type CollaborationRequest,
  type CollaborationResponse,
  toCollaborationResponse,
} from "../../../model/collaboration-model";

export default class CollaborationRepositories {
  // Done
  static async verifyCollaborator(
    cartId: string,
    user: User,
  ): Promise<boolean> {
    const collaborator = await prisma.cartSharedUser.findFirst({
      where: {
        cartId,
        userId: user.id,
      },
    });

    if (!collaborator) {
      throw new InvariantError("Kolaborator gagal diverifikasi");
    }

    return true;
  }

  // Done
  static async addCollaboration(
    request: CollaborationRequest,
  ): Promise<CollaborationResponse> {
    // Pastikan user eksis
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new NotFoundError("Pengguna tidak ditemukan");
    }

    // Hindari duplikasi
    const existingCollab = await prisma.cartSharedUser.findFirst({
      where: {
        cartId: request.cartId,
        userId: request.userId,
      },
    });

    if (existingCollab) {
      throw new InvariantError("Kolaborator sudah ada pada cart ini");
    }

    const id = `collab-${nanoid(17)}`;

    const collaboration = await prisma.cartSharedUser.create({
      data: {
        id,
        cartId: request.cartId,
        userId: request.userId,
      },
    });

    return toCollaborationResponse(collaboration);
  }

  // Done
  static async deleteCollaboration(
    request: CollaborationRequest,
  ): Promise<void> {
    const collaboration = await prisma.cartSharedUser.findFirst({
      where: {
        cartId: request.cartId,
        userId: request.userId,
      },
    });

    if (!collaboration) {
      throw new NotFoundError("Kolaborator tidak ditemukan pada cart ini");
    }

    await prisma.cartSharedUser.delete({
      where: {
        cartId_userId: {
          cartId: request.cartId,
          userId: request.userId,
        },
      },
    });
  }
}
