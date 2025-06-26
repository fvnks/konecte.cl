import { NextResponse } from 'next/server';
import { getRequestByCodeAction } from '@/actions/requestActions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: 'Código de publicación es requerido' }, { status: 400 });
  }

  try {
    const propertyRequest = await getRequestByCodeAction(code);

    if (!propertyRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json(propertyRequest);
  } catch (error) {
    console.error(`Error al buscar solicitud por código ${code}:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 