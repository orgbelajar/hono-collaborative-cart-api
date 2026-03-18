import { Hono } from "hono";
import CategoryRepositories from "../repositories/category-repositories";
import { categoryPayloadSchema } from "../validator/schema";

export const categoryController = new Hono();

categoryController.post("/api/category", async (c) => {
  const request = categoryPayloadSchema.parse(await c.req.json());

  const response = await CategoryRepositories.addCategory(request);

  return c.json(
    {
      status: "success",
      message: "Kategori produk berhasil ditambahkan",
      data: response,
    },
    201,
  );
});

categoryController.get("/api/categories", async (c) => {
  const response = await CategoryRepositories.getCategories();

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

categoryController.get("/api/category/:id/products", async (c) => {
  const id = c.req.param("id");

  const response = await CategoryRepositories.getCategoryWithProductsById(id);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});

categoryController.patch("/api/category/:id", async (c) => {
  const id = c.req.param("id");
  const request = categoryPayloadSchema.parse(await c.req.json());

  const response = await CategoryRepositories.editCategoryById(id, request);

  return c.json(
    {
      status: "success",
      message: "Kategori produk berhasil diperbarui",
      data: response,
    },
    200,
  );
});

categoryController.delete("/api/category/:id", async (c) => {
  const id = c.req.param("id");

  await CategoryRepositories.deleteCategoryById(id);

  return c.json(
    {
      status: "success",
      message: "Kategori produk berhasil dihapus",
    },
    200,
  );
});
