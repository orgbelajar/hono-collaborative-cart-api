import { prisma } from "../../../applications/database";
import {
  AddProductRequest,
  EditProductRequest,
  ProductResponse,
  toProductResponse,
} from "../../../model/product-model";
import { nanoid } from "nanoid";
import { NotFoundError } from "../../../exceptions/index";

export class ProductRepository {
  static async addProduct(
    request: AddProductRequest,
  ): Promise<ProductResponse> {
    const id = `product-${nanoid(17)}`;

    const product = await prisma.product.create({
      data: {
        id,
        ...request,
      },
    });

    return toProductResponse(product);
  }

  static async getProductById(id: string): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundError("Produk tidak ditemukan");
    }

    return toProductResponse(product);
  }

  static async editProductById(
    id: string,
    request: EditProductRequest,
  ): Promise<ProductResponse> {
    await this.getProductById(id);

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        ...request,
      },
    });

    return toProductResponse(product);
  }

  static async deleteProductById(id: string): Promise<void> {
    await this.getProductById(id);

    await prisma.product.delete({
      where: {
        id,
      },
    });
  }
}
