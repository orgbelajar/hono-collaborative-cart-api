import { Hono } from "hono";
import { ProductRepository } from "../repositories/index";
import {
  addProductPayloadSchema,
  editProductPayloadSchema,
  restockProductPayloadSchema,
} from "../validator/index";
import InvariantError from "../../../exceptions/invariant-error";
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

  const body = await c.req.parseBody();
  const file = body["image"];

  // Validasi: pastikan file ada dan bertipe File
  if (!file || !(file instanceof File)) {
    throw new InvariantError("File gambar wajib diunggah pada field 'image'");
  }

  // Validasi: tipe file
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    throw new InvariantError(
      "Tipe file tidak didukung. Gunakan JPEG, JPG, PNG, atau WebP",
    );
  }

  // Validasi: ukuran file
  if (file.size > MAX_FILE_SIZE) {
    throw new InvariantError("Ukuran file melebihi batas maksimum 5MB");
  }

  // Pastikan direktori upload ada
  await ensureUploadDir();

  // Ambil data produk untuk cek gambar lama
  const existingProduct = await ProductRepository.getProductById(id);

  // Generate nama file unik
  const ext = MIME_TO_EXT[file.type];
  const originalName = file.name.replace(/\.[^/.]+$/, "");
  const filename = `${Date.now()}-${originalName}.${ext}`;
  const filepath = `${UPLOAD_DIR}/${filename}`;

  // Simpan file ke disk menggunakan Bun API
  const buffer = await file.arrayBuffer();
  await Bun.write(filepath, buffer);

  // Buat URL lokasi file
  const host = process.env.HOST || "localhost";
  const port = process.env.PORT || 3000;
  const fileLocation = `http://${host}:${port}/images/${encodeURIComponent(filename)}`;

  await ProductRepository.addImageProductById(id, fileLocation);

  // Hapus gambar lama dari disk jika ada
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
productController.post("/api/product/:id/likes", authMiddleware, async (c) => {
  const productId = c.req.param("id");
  const credential = c.get("user");

  const response = await ProductRepository.likeProduct(productId, credential);

  return c.json(
    {
      status: "success",
      message: "Produk berhasil disukai",
      data: response,
    },
    201,
  );
});

productController.delete(
  "/api/product/:id/likes",
  authMiddleware,
  async (c) => {
    const productId = c.req.param("id");
    const credential = c.get("user");

    await ProductRepository.unlikeProduct(productId, credential);

    return c.json(
      {
        status: "success",
        message: "Batal menyukai produk",
      },
      200,
    );
  },
);

productController.get("/api/product/:id/likes", authMiddleware, async (c) => {
  const productId = c.req.param("id");

  const response = await ProductRepository.getProductLikes(productId);

  return c.json(
    {
      status: "success",
      data: response,
    },
    200,
  );
});
