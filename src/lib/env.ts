import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi di .env'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET wajib diisi di .env'),
  NEXTAUTH_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_CAMPUS_NAME: z.string().optional().default('STIMI Makassar'),
  DEFAULT_CAMPUS_LAT: z.string().optional().default('-5.147665'),
  DEFAULT_CAMPUS_LNG: z.string().optional().default('119.432732'),
  DEFAULT_CAMPUS_RADIUS: z.string().optional().default('100'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional().default('presensistimi'),
});

// Validasi runtime aman (hanya log peringatan tanpa membuat app crash jika variabel opsional belum ada)
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('[Environment Config Advisory]:', parsed.error.format());
    return null;
  }
  return parsed.data;
}

export const env = validateEnv();
