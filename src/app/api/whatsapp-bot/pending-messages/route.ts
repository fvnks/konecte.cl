// This API route is deprecated and no longer in use.
// The current implementation pushes messages directly to the bot's webhook.
// This file can be safely deleted.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: false, message: 'This endpoint is deprecated.' }, { status: 410 });
}
