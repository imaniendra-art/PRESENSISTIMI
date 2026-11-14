import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'PANDUAN_PENGGUNA.md');
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Berkas pedoman tidak ditemukan.', { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Buku_Pedoman_PRESENSISTIMI_v1.4.3.md"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error saat mengunduh berkas pedoman:', error);
    return new NextResponse('Gagal mengunduh berkas pedoman.', { status: 500 });
  }
}
