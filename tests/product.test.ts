import { beforeAll, describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Products API", () => {
  let categoryId: string;
  let productId: string;
  let accessToken: string;
  const testUsername = `testuser_prod_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // 1. Buat Kategori untuk Produk
    const catRes = await app.request("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kategori Produk Test" }),
    });
    const catBody = await catRes.json();
    categoryId = catBody.data.categoryId;

    // 2. Buat User untuk Test Wishlist
    await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: "password123",
        fullname: "Product Test User",
      }),
    });

    // 3. Login untuk dapat Token
    const loginRes = await app.request("/api/authentication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, password: "password123" }),
    });
    const loginBody = await loginRes.json();
    accessToken = loginBody.data.accessToken;
  });

  it("POST /api/product should create a new product", async () => {
    const res = await app.request("/api/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Macbook Pro M3",
        description: "Laptop super kencang",
        price: 25000000,
        stock: 10,
        categoryId: categoryId,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.name).toBe("Macbook Pro M3");
    productId = body.data.id;
  });

  it("GET /api/products should return list of products with filters", async () => {
    // Test pencarian berdasarkan query 'Macbook'
    const res = await app.request(
      `/api/products?q=Macbook&categoryId=${categoryId}&min_price=1000&max_price=50000000`,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name).toContain("Macbook");
  });

  it("GET /api/product/:id should return product detail", async () => {
    const res = await app.request(`/api/product/${productId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.id).toBe(productId);
  });

  it("POST /api/product/:id/image should upload product image", async () => {
    const formData = new FormData();
    // Mengirim blob sebagai file palsu
    formData.append("image", new Blob(["fake-image-data"], { type: "image/jpeg" }), "test.jpg");

    const res = await app.request(`/api/product/${productId}/image`, {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toContain("berhasil diunggah");
  });

  it("PATCH /api/product/:id should update product info", async () => {
    const res = await app.request(`/api/product/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Macbook Pro M3 Updated",
        price: 26000000,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Macbook Pro M3 Updated");
  });

  it("PATCH /api/product/:id/stock should restock product", async () => {
    const res = await app.request(`/api/product/${productId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock: 5,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Stok produk berhasil ditambahkan");
  });

  it("POST /api/product/:id/wishlist should add to wishlist (Auth Required)", async () => {
    const res = await app.request(`/api/product/${productId}/wishlist`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("Produk berhasil dimasukkan ke wishlist");
  });

  it("GET /api/product/:id/wishlists should return wishlist count with X-Source", async () => {
    // 1. First call - should be from 'server'
    const res1 = await app.request(`/api/product/${productId}/wishlists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-Source")).toBe("server");

    // 2. Second call - should be from 'cache'
    const res2 = await app.request(`/api/product/${productId}/wishlists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res2.status).toBe(200);
    expect(res2.headers.get("X-Source")).toBe("cache");
  });

  it("DELETE /api/product/:id/wishlist should remove from wishlist", async () => {
    const res = await app.request(`/api/product/${productId}/wishlist`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Produk berhasil dihapus dari wishlist");
  });

  it("DELETE /api/product/:id should delete product", async () => {
    const res = await app.request(`/api/product/${productId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
  });
});
