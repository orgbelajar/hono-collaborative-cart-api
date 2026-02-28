import { prisma } from "../../../applications/database";
import {
  CollaborationRequest,
  CollaborationResponse,
  toCollaborationResponse,
} from "../../../model/collaboration-model";
import { nanoid } from "nanoid";
import NotFoundError from "../../../exceptions/not-found-error";
import InvariantError from "../../../exceptions/invariant-error";
import { User } from "../../../../generated/prisma/client";

export class CollaborationRepositories {
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

  // TODO
  static async addCollaboration(
    request: CollaborationRequest,
    userId: User,
  ): Promise<CollaborationResponse> {
    const { cartId } = request;

    // Pastikan user eksis
    const user = await prisma.user.findUnique({
      where: { id: userId.id },
    });

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    // Hindari duplikasi
    // const existingCollab = await prisma.cartSharedUser.findFirst({
    //   where: {
    //     cartId,
    //     userId,
    //   },
    // });

    // if (existingCollab) {
    //   return toCollaborationResponse(existingCollab);
    // }

    const id = `collab-${nanoid(16)}`;

    const collaboration = await prisma.cartSharedUser.create({
      data: {
        id,
        cartId,
        userId: userId.id,
      },
    });

    return toCollaborationResponse(collaboration);
  }
}

// TODO
//   static async deleteCollaboration(
//     request: CollaborationRequest,
//   ): Promise<void> {
//     const collaboration = await prisma.cartSharedUser.findFirst({
//       where: {
//         cartId: request.cartId,
//         userId: request.userId,
//       },
//     });

//     if (!collaboration) {
//       throw new NotFoundError("Kolaborator tidak ditemukan pada cart ini");
//     }

//     await prisma.cartSharedUser.delete({
//       where: {
//         id: collaboration.id,
//       },
//     });
//   }
// }
