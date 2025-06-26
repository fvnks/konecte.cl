import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, properties, searchRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  telefono: z.string(),
  // Add any fields that can be updated
  titulo: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  budgetMax: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = req.headers.get('authorization')?.split(' ')[1];
    if (authToken !== process.env.WHATSAPP_BOT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { telefono, ...updateData } = validation.data;
    const { id } = params;

    const user = await db.query.users.findFirst({ where: eq(users.phone, telefono) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updated = false;

    try {
        const result = await db.update(properties)
            .set(updateData)
            .where(and(eq(properties.id, id), eq(properties.userId, user.id)));
        if (result.rowsAffected > 0) updated = true;
    } catch (e) { /* ignore, try next table */ }

    if (!updated) {
        try {
            const result = await db.update(searchRequests)
                .set(updateData)
                .where(and(eq(searchRequests.id, id), eq(searchRequests.userId, user.id)));
            if (result.rowsAffected > 0) updated = true;
        } catch (e) { /* ignore */ }
    }

    if (updated) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Publication not found or user not authorized' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating publication:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const deleteSchema = z.object({
  telefono: z.string(),
});

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authToken = req.headers.get('authorization')?.split(' ')[1];
        if (authToken !== process.env.WHATSAPP_BOT_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = deleteSchema.safeParse(body);
        if(!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }
        
        const { telefono } = validation.data;
        const { id } = params;

        const user = await db.query.users.findFirst({ where: eq(users.phone, telefono) });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let deleted = false;

        try {
            const result = await db.delete(properties).where(and(eq(properties.id, id), eq(properties.userId, user.id)));
            if (result.rowsAffected > 0) deleted = true;
        } catch(e) { /* ignore */ }

        if(!deleted) {
            try {
                const result = await db.delete(searchRequests).where(and(eq(searchRequests.id, id), eq(searchRequests.userId, user.id)));
                if (result.rowsAffected > 0) deleted = true;
            } catch(e) { /* ignore */ }
        }

        if (deleted) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Publication not found or user not authorized' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting publication:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 