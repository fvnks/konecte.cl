import { NextResponse } from 'next/server';
import { getPropertyByCodeAction } from '@/actions/propertyActions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: 'Código de publicación es requerido' }, { status: 400 });
  }

  try {
    const property = await getPropertyByCodeAction(code);

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error(`Error al buscar propiedad por código ${code}:`, error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 