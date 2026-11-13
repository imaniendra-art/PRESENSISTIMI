import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    if (pathSegments.length === 0) {
      return new NextResponse('File path not provided', { status: 400 });
    }

    // Sanitasi dari Directory Traversal attack
    const sanitizedSegments = pathSegments.map((segment) =>
      segment.replace(/[^a-zA-Z0-9._-]/g, '')
    );

    if (sanitizedSegments.some((seg) => seg.includes('..') || !seg)) {
      return new NextResponse('Invalid file path', { status: 400 });
    }

    // Cari file di direktori public/uploads/[path] atau uploads/[path]
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', ...sanitizedSegments),
      path.join(process.cwd(), 'uploads', ...sanitizedSegments),
    ];

    for (const filePath of possiblePaths) {
      try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch {
        // Coba path alternatif jika file tidak ditemukan
        continue;
      }
    }

    // Fallback: Jika tidak ditemukan di lokal, arahkan ke Supabase Cloud Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'presensistimi';
    if (
      supabaseUrl &&
      !supabaseUrl.includes('your-project') &&
      !supabaseUrl.includes('your-supabase-url')
    ) {
      const remoteUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${sanitizedSegments.join('/')}`;
      return NextResponse.redirect(remoteUrl, { status: 307 });
    }

    return new NextResponse('File not found', { status: 404 });
  } catch (error) {
    console.error('[Uploads Route Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
