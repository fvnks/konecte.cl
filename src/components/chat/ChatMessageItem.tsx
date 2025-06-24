// src/components/chat/ChatMessageItem.tsx
'use client';

import type { ChatMessage } from '@/lib/types';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
}

export default function ChatMessageItem({ message, currentUserId }: ChatMessageItemProps) {
  // Cambio drástico para depuración.
  // Si esto se renderiza, sabemos que los cambios se están desplegando.
  return <div className="p-4 bg-yellow-200 border border-yellow-500 rounded-lg">Mensaje de prueba</div>;
}
