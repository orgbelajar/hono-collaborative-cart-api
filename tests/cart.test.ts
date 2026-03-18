import { beforeAll, describe, expect, it } from "bun:test";
import app from "../src/server/index";

describe("Carts API (Collaborative)", () => {
  let categoryId: string;
  let productId: string;
  let accessToken: string;
  let cartId: string;
  const testUsername = `cartuser_${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // 1. Registrasi User & Login
    await app.request("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUsername,
        password: "password123",
        fullname: "Cart Tester",
      }),
    });
    const loginRes = await app.request("/api/authentication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUsername, password: "password123" }),
    });
    const loginBody = await loginRes.json();
    accessToken = loginBody.data.accessToken;

    // 2. Setup Category & Product
    const catRes = await app.request("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kategori Cart" }),
    });
    const catBody = await catRes.json();
    categoryId = catBody.data.categoryId;

    const prodRes = await app.request("/api/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Produk Keranjang",
        price: 10000,
        stock: 100,
        categoryId: categoryId,
      }),
    });
    const prodBody = await prodRes.json();
    productId = prodBody.data.id;
  });

  it("POST /api/cart should create a new cart", async () => {
    const res = await app.request("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Keranjang Belanja Saya",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    cartId = body.data.id;
  });

  it("GET /api/carts should return list of user carts", async () => {
    const res = await app.request("/api/carts", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((c: any) => c.id === cartId)).toBe(true);
  });

  it("POST /api/cart/:id/product should add product to cart", async () => {
    const res = await app.request(`/api/cart/${cartId}/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        productId: productId,
        qty: 5,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe(
      "Produk berhasil ditambahkan ke keranjang belanja",
    );
  });

  it("GET /api/cart/:id/products should return products in cart", async () => {
    const res = await app.request(`/api/cart/${cartId}/products`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data.products)).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);
    // Di model CartProductItem mengembalikan id (yang merupakan productId)
    expect(body.data.products[0].id).toBe(productId);
    expect(body.data.products[0].qty).toBe(5);
  });

  it("GET /api/cart/:id/activities should return cart activities", async () => {
    const res = await app.request(`/api/cart/${cartId}/activities`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].action).toBe("add");
  });

  it("DELETE /api/cart/:id/products should remove product from cart and log activity", async () => {
    // 1. Hapus produk (decrement qty dari 5 ke 4)
    const resDel = await app.request(`/api/cart/${cartId}/products`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        productId: productId,
      }),
    });

    expect(resDel.status).toBe(200);
    const bodyDel = await resDel.json();
    expect(bodyDel.message).toBe(
      "Produk berhasil dihapus dari keranjang belanja",
    );

    // 2. Verifikasi quantity berkurang dari 5 ke 4
    const resGet1 = await app.request(`/api/cart/${cartId}/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const bodyGet1 = await resGet1.json();
    expect(bodyGet1.data.products[0].qty).toBe(4);

    // 3. Hapus hingga habis (4 -> 3 -> 2 -> 1 -> hapus total)
    for (let i = 0; i < 4; i++) {
      await app.request(`/api/cart/${cartId}/products`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productId }),
      });
    }

    // 4. Verifikasi produk sudah tidak ada di keranjang sama sekali
    const resGet2 = await app.request(`/api/cart/${cartId}/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const bodyGet2 = await resGet2.json();
    expect(bodyGet2.data.products.length).toBe(0);

    // 5. Verifikasi aktivitas 'delete' tercatat
    const resAct = await app.request(`/api/cart/${cartId}/activities`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const bodyAct = await resAct.json();
    expect(bodyAct.data.some((a: any) => a.action === "delete")).toBe(true);
  });

  it("DELETE /api/cart/:id should delete cart", async () => {
    const res = await app.request(`/api/cart/${cartId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("Keranjang belanja berhasil dihapus");
  });
});
