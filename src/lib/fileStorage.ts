import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache instance client Supabase
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Gunakan service role key jika ada (untuk bypass RLS saat upload server-side), atau fallback ke anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  return supabaseClient;
}

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'presensistimi';

/**
 * Memastikan bucket Supabase ada dan berstatus publik
 */
async function ensureSupabaseBucket(supabase: SupabaseClient, bucketName: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);

    if (!exists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'application/pdf'],
      });
    }
  } catch {
    // Abaikan jika tidak memiliki izin admin untuk list/create bucket (misal memakai anon key)
  }
}

/**
 * Menyimpan foto selfie presensi (masuk / pulang) dengan auto-resize & kompresi WebP.
 * Bekerja secara HYBRID: Selalu membuat salinan lokal di /public/uploads/selfie
 * dan mengunggah ke Supabase Storage jika kredensial diatur.
 */
export async function saveSelfieImage(
  base64Data: string,
  prefix: 'in' | 'out',
  nip: string
): Promise<string> {
  // 1. Ekstrak data binary dari base64
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const data = matches ? matches[2] : base64Data;
  const rawBuffer = Buffer.from(data, 'base64');

  // 2. Auto-resize dan kompresi WebP via Sharp (ukuran terpangkas drastis menjadi ~15-25 KB)
  const optimizedBuffer = await sharp(rawBuffer)
    .resize(480, 640, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 75, effort: 4 })
    .toBuffer();

  const timestamp = Date.now();
  const filename = `${prefix}_${nip}_${timestamp}.webp`;

  // 3. Simpan salinan lokal di folder /public/uploads/selfie
  const localUploadDir = path.join(process.cwd(), 'public', 'uploads', 'selfie');
  await fs.mkdir(localUploadDir, { recursive: true });
  const localFilePath = path.join(localUploadDir, filename);
  await fs.writeFile(localFilePath, optimizedBuffer);
  const localUrl = `/uploads/selfie/${filename}`;

  // 4. Jika Supabase dikonfigurasi, unggah ke Supabase Storage (Hybrid Cloud)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await ensureSupabaseBucket(supabase, DEFAULT_BUCKET);

      const remotePath = `selfie/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .upload(remotePath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(DEFAULT_BUCKET)
          .getPublicUrl(remotePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('[Hybrid Storage] Supabase upload failed, using local copy:', uploadError.message);
      }
    } catch (supaErr) {
      console.warn('[Hybrid Storage] Supabase exception, fallback to local:', supaErr);
    }
  }

  // Fallback / default lokal
  return localUrl;
}

/**
 * Menyimpan file dokumen (bukti cuti, sakit, surat tugas dinas luar).
 * Jika bertipe gambar, otomatis dikompresi WebP. Jika PDF, disimpan apa adanya.
 */
export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const rawBuffer = Buffer.from(bytes);

  const timestamp = Date.now();
  let bufferToSave = rawBuffer;
  let filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  let mimeType = file.type || 'application/octet-stream';

  // Jika file adalah gambar, kompresi otomatis ke WebP
  if (file.type.startsWith('image/')) {
    try {
      bufferToSave = await sharp(rawBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      filename = `${timestamp}_${nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_')}.webp`;
      mimeType = 'image/webp';
    } catch (e) {
      console.warn('Gagal kompresi sharp dokumen, menyimpan format asli:', e);
    }
  }

  // 1. Simpan salinan lokal di folder /public/uploads/[folder]
  const localUploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(localUploadDir, { recursive: true });
  const localFilePath = path.join(localUploadDir, filename);
  await fs.writeFile(localFilePath, bufferToSave);
  const localUrl = `/uploads/${folder}/${filename}`;

  // 2. Unggah ke Supabase Storage jika dikonfigurasi (Hybrid Cloud)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await ensureSupabaseBucket(supabase, DEFAULT_BUCKET);

      const remotePath = `${folder}/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .upload(remotePath, bufferToSave, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(DEFAULT_BUCKET)
          .getPublicUrl(remotePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('[Hybrid Storage] Supabase document upload failed, using local copy:', uploadError.message);
      }
    } catch (supaErr) {
      console.warn('[Hybrid Storage] Supabase exception, fallback to local:', supaErr);
    }
  }

  return localUrl;
}
