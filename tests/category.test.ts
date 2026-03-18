import { describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Categories API", () => {
  let categoryId: string;

  it("POST /api/category should create a new category", async () => {
    const res = await app.request("/api/category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Elektronik Test",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.name).toBe("Elektronik Test");
    expect(body.data.slug).toBeDefined();
    categoryId = body.data.categoryId;
  });

  it("GET /api/categories should return all categories", async () => {
    const res = await app.request("/api/categories");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("PATCH /api/category/:id should update a category", async () => {
    const res = await app.request(`/api/category/${categoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Elektronik Updated",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.name).toBe("Elektronik Updated");
  });

  it("GET /api/category/:id/products should return category with its products", async () => {
    // 1. Buat produk dalam kategori ini
    const prodRes = await app.request("/api/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Produk Kategori Test",
        price: 5000,
        stock: 10,
        categoryId: categoryId,
      }),
    });
    const prodBody = await prodRes.json();
    const productId = prodBody.data.id;

    // 2. Cek apakah produk muncul di category detail
    const res = await app.request(`/api/category/${categoryId}/products`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.name).toBe("Elektronik Updated");
    expect(Array.isArray(body.data.products)).toBe(true);
    expect(
      body.data.products.some((p: any) => p.name === "Produk Kategori Test"),
    ).toBe(true);

    // 3. Bersihkan produk agar kategori bisa dihapus
    await app.request(`/api/product/${productId}`, { method: "DELETE" });
  });

  it("DELETE /api/category/:id should delete a category", async () => {
    const res = await app.request(`/api/category/${categoryId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("Kategori produk berhasil dihapus");
  });
});
