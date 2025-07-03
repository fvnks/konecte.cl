import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return new NextResponse('No autenticado.', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return new NextResponse('Nombre de archivo o cuerpo de la petición ausente.', { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
      // Podríamos añadir un prefijo para organizar, ej: `groups/avatars/${filename}`
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('[BLOB_UPLOAD_ERROR]', error);
    return new NextResponse(`Error al subir el archivo: ${error.message}`, { status: 500 });
  }
} 