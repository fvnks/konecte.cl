// src/components/layout/FloatingAssistantButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, X } from 'lucide-react';
import AssistantChatWidget from '@/components/ai/AssistantChatWidget';
import { cn } from '@/lib/utils';

export default function FloatingAssistantButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        variant="default"
        size="icon"
        className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        aria-label={isChatOpen ? "Cerrar chat con asistente" : "Abrir chat con asistente"}
      >
        {isChatOpen ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
      </Button>
      
      <AssistantChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
