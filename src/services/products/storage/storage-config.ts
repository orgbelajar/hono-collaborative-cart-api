import fs from "node:fs/promises";
import path from "node:path";

// Path absolut ke direktori penyimpanan gambar
export const UPLOAD_DIR = path.resolve(process.cwd(), "src/services/products/files/images");

// Tipe file yang diizinkan
export const ALLOWED_IMAGE_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp"] as const;

// Maksimum ukuran file (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Mapping MIME type ke ekstensi file
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

// Buat direktori upload jika belum ada
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

// Hapus gambar lama dari disk jika ada
export async function deleteOldImage(imageUrl: string): Promise<void> {
  try {
    // ambil nama file dari url
    const oldFilename = decodeURIComponent(imageUrl.split("/images/")[1]);
    await fs.unlink(`${UPLOAD_DIR}/${oldFilename}`);
  } catch {
    // File tidak ditemukan di disk, abaikan
  }
}
