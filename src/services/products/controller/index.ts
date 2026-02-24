import { Hono } from "hono";
import { ProductRepository } from "../repositories/index";
import {
  addProductPayloadSchema,
  editProductPayloadSchema,
} from "../validator/index";

export const productController = new Hono();

productController.post("/api/products", async (c) => {
  const request = addProductPayloadSchema.parse(await c.req.json());

  const response = await ProductRepository.addProduct(request);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

productController.get("/api/products/:id", async (c) => {
  const id = c.req.param("id");

  const response = await ProductRepository.getProductById(id);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

productController.put("/api/products/:id", async (c) => {
  const id = c.req.param("id");
  const request = editProductPayloadSchema.parse(await c.req.json());

  const response = await ProductRepository.editProductById(id, request);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil diperbarui",
      data: response,
    },
    200,
  );
});

productController.delete("/api/products/:id", async (c) => {
  const id = c.req.param("id");

  await ProductRepository.deleteProductById(id);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil dihapus",
    },
    200,
  );
});
