// This API route is deprecated and no longer in use.
// The WebSocket implementation in `server.ts` handles bot replies directly via /api/bot-reply.
// This file can be safely deleted.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: false, message: 'This endpoint is deprecated.' }, { status: 410 });
}
