import fs from 'fs/promises';
import path from 'path';

/**
 * Menyimpan data gambar Base64 ke folder /public/uploads/selfie
 * dan mengembalikan path URL publik untuk disimpan ke database.
 */
export async function saveSelfieImage(
  base64Data: string,
  prefix: 'in' | 'out',
  nip: string
): Promise<string> {
  // Buat direktori jika belum ada
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'selfie');
  await fs.mkdir(uploadDir, { recursive: true });

  // Bersihkan header Data URL jika ada (misal: "data:image/jpeg;base64,...")
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const data = matches ? matches[2] : base64Data;
  const buffer = Buffer.from(data, 'base64');

  const timestamp = Date.now();
  const filename = `${prefix}_${nip}_${timestamp}.jpg`;
  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/selfie/${filename}`;
}

/**
 * Menyimpan file dokumen (PDF/Gambar) dari FormData
 */
export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}_${cleanName}`;
  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${filename}`;
}
