import { Hono } from "hono";
import fs from "fs/promises";
import { ProductRepository } from "../repositories/product-repositories";
import {
  addProductPayloadSchema,
  editProductPayloadSchema,
  restockProductPayloadSchema,
} from "../validator/schema";
import {
  ALLOWED_IMAGE_TYPES,
  deleteOldImage,
  ensureUploadDir,
  MAX_FILE_SIZE,
  MIME_TO_EXT,
  UPLOAD_DIR,
} from "../storage/storage-config";
import { authMiddleware } from "../../../middlewares/auth";
import { ApplicationVariables } from "../../../model/app-model";
import { GetProductsRequest } from "../../../model/product-model";
import ClientError from "../../../exceptions/client-error";

export const productController = new Hono<{
  Variables: ApplicationVariables;
}>();

productController.post("/api/product", async (c) => {
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

productController.post("/api/product/:id/image", async (c) => {
  const id = c.req.param("id");

  // Gunakan { all: true } agar Hono mengembalikan array jika ada lebih dari satu file pada field yang sama
  const body = await c.req.parseBody({ all: true });
  const file = body["image"];

  // Validasi: hanya boleh satu file (harus dicek SEBELUM instanceof File)
  if (Array.isArray(file)) {
    throw new ClientError("Field 'image' hanya boleh berisi satu file");
  }

  // Validasi: pastikan file ada dan bertipe File
  if (!file || !(file instanceof File)) {
    throw new ClientError("File gambar wajib diunggah pada field 'image'");
  }

  // Validasi: tipe file
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    throw new ClientError(
      "Tipe file tidak didukung. Gunakan JPEG, JPG, PNG, atau WebP",
    );
  }

  // Validasi: ukuran file
  if (file.size > MAX_FILE_SIZE) {
    throw new ClientError("Ukuran file melebihi batas maksimum 5MB");
  }

  // Pastikan direktori upload ada atau buat baru jika tidak ada
  await ensureUploadDir();

  // Ambil data produk untuk cek gambar lama
  const existingProduct = await ProductRepository.getProductById(id);

  // Generate nama file unik
  const ext = MIME_TO_EXT[file.type];
  const originalName = file.name.replace(/\.[^/.]+$/, "");
  const filename = `${Date.now()}-${originalName}.${ext}`;
  const filepath = `${UPLOAD_DIR}/${filename}`;

  // Simpan file ke disk menggunakan Bun API
  // Tidak perlu convert ke Buffer karena Bun.write() bisa menerima Blob / File langsung. (hemat RAM untuk file besar)
  await Bun.write(filepath, file);

  // Buat URL lokasi file
  const host = process.env.HOST || "localhost";
  const port = process.env.PORT || 3000;
  const encodedFilename = encodeURIComponent(filename);
  const fileLocation = `http://${host}:${port}/images/${encodedFilename}`;

  try {
    await ProductRepository.addOrUpdateImageProductById(id, fileLocation);
  } catch (error) {
    // Rollback: hapus file baru dari disk jika update database gagal
    // agar tidak ada orphan file (file tanpa referensi di DB)
    await fs.unlink(filepath).catch(() => {});
    // NotFoundError atau 500 Internal Server Error
    throw error;
  }

  // Hapus gambar lama hanya setelah DB berhasil diupdate
  if (existingProduct.image) {
    await deleteOldImage(existingProduct.image);
  }

  return c.json(
    {
      status: "success",
      message: "Gambar produk berhasil diunggah",
      data: { fileLocation },
    },
    201,
  );
});

productController.get("/api/products", async (c) => {
  const request: GetProductsRequest = {
    page: Number(c.req.query("page") ?? 1), // default ke halaman 1 jika tidak disertakan
    size: Number(c.req.query("size") ?? 10), // default 10 item per halaman jika tidak disertakan
    name: c.req.query("name"),
    min_price: c.req.query("min_price")
      ? Number(c.req.query("min_price"))
      : undefined,
    max_price: c.req.query("max_price")
      ? Number(c.req.query("max_price"))
      : undefined,
    in_stock: c.req.query("in_stock") === "true",
    category_slug: c.req.query("category_slug"),
    sort_by: c.req.query("sort_by") as GetProductsRequest["sort_by"],
    sort_order: c.req.query("sort_order") as GetProductsRequest["sort_order"],
  };

  const { data, paging } = await ProductRepository.getProducts(request);

  return c.json(
    {
      status: "success",
      data,
      paging,
    },
    200,
  );
});

productController.get("/api/product/:id", async (c) => {
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

productController.patch("/api/product/:id", async (c) => {
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

productController.patch("/api/product/:id/stock", async (c) => {
  const id = c.req.param("id");
  const request = restockProductPayloadSchema.parse(await c.req.json());

  const response = await ProductRepository.restockProduct(id, request);

  return c.json(
    {
      status: "success",
      message: "Stok produk berhasil ditambahkan",
      data: response,
    },
    200,
  );
});

productController.delete("/api/product/:id", async (c) => {
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

// Endpoint likes — memerlukan autentikasi
productController.post(
  "/api/product/:id/wishlist",
  authMiddleware,
  async (c) => {
    const productId = c.req.param("id");
    const credential = c.get("user");

    const response = await ProductRepository.wishlistProduct(
      productId,
      credential,
    );

    return c.json(
      {
        status: "success",
        message: "Produk berhasil dimasukkan ke wishlist",
        data: response,
      },
      201,
    );
  },
);

productController.delete(
  "/api/product/:id/wishlist",
  authMiddleware,
  async (c) => {
    const productId = c.req.param("id");
    const credential = c.get("user");

    await ProductRepository.removeFromWishlist(productId, credential);

    return c.json(
      {
        status: "success",
        message: "Produk berhasil dihapus dari wishlist",
      },
      200,
    );
  },
);

productController.get(
  "/api/product/:id/wishlist",
  authMiddleware,
  async (c) => {
    const productId = c.req.param("id");

    const response = await ProductRepository.getProductWishlist(productId);

    return c.json(
      {
        status: "success",
        data: response,
      },
      200,
    );
  },
);
