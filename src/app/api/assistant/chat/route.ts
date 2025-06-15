// src/app/api/assistant/chat/route.ts
import { NextResponse } from 'next/server';
import { getAssistantResponse, type AssistantChatInput } from '@/ai/flows/assistant-chat-flow';

export async function POST(request: Request) {
  console.log('[API AssistantChat] Received POST request.');
  try {
    // Asumimos que el userId podría venir en el futuro, pero no es estrictamente necesario para este flujo simple
    const payload: { message: string; userId?: string } = await request.json();
    console.log('[API AssistantChat] Payload received:', JSON.stringify(payload));

    if (!payload.message) {
      console.error('[API AssistantChat] Error: Message missing in payload.');
      return NextResponse.json({ success: false, message: 'El mensaje es requerido.' }, { status: 400 });
    }

    const assistantInput: AssistantChatInput = { userInput: payload.message };
    const assistantResult = await getAssistantResponse(assistantInput);
    
    console.log('[API AssistantChat] Assistant response generated:', assistantResult.assistantResponse);
    return NextResponse.json({ success: true, response: assistantResult.assistantResponse });

  } catch (error: any) {
    console.error('[API AssistantChat] Error processing request:', error.message, error.stack);
    return NextResponse.json({ success: false, message: error.message || 'Error interno del servidor al chatear con el asistente.' }, { status: 500 });
  }
}
