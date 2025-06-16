// src/components/ai/AssistantChatWidget.tsx
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, User, X, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AssistantChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOT_NAME = "Asistente Konecte";
const BOT_AVATAR_URL = `https://placehold.co/40x40/64B5F6/FFFFFF.png?text=AI`; // Azul primario

export default function AssistantChatWidget({ isOpen, onClose }: AssistantChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial greeting message from bot when chat opens for the first time in a session
      setMessages([
        {
          id: `assistant-greeting-${Date.now()}`,
          sender: 'assistant',
          text: `¡Hola! Soy ${BOT_NAME}. ¿Cómo puedo ayudarte hoy con tus consultas inmobiliarias o sobre la plataforma?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsReplying(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });

      const result = await response.json();

      if (result.success && result.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: result.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.message || 'No se pudo obtener respuesta del asistente.');
      }
    } catch (error: any) {
      console.error("Error calling assistant API:", error);
      toast({
        title: "Error de Asistente",
        description: error.message || "No se pudo conectar con el asistente.",
        variant: "destructive",
      });
      // Optionally, add the failed user message back to input or show an error message in chat
       setMessages(prev => [...prev, {id: `error-${Date.now()}`, sender: 'assistant', text: "Lo siento, tuve un problema al procesar tu mensaje. Intenta de nuevo.", timestamp: new Date() }]);
    } finally {
      setIsReplying(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-[60] w-[calc(100%-2rem)] max-w-sm h-[70vh] max-h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-secondary/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={BOT_AVATAR_URL} alt={BOT_NAME} data-ai-hint="asistente AI"/>
            <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
          </Avatar>
          <h3 className="text-sm font-semibold text-foreground">{BOT_NAME}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar chat</span>
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%]",
                msg.sender === 'user' ? "self-end flex-row-reverse ml-auto" : "self-start mr-auto"
              )}
            >
              {msg.sender === 'assistant' && (
                <Avatar className="h-7 w-7 border self-end mb-0.5">
                  <AvatarImage src={BOT_AVATAR_URL} alt={BOT_NAME} data-ai-hint="AI bot"/>
                  <AvatarFallback><Bot className="h-3 w-3"/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "p-2.5 rounded-lg shadow-sm",
                  msg.sender === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                )}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                 {/* Timestamp (optional, can be shown on hover) */}
                 {/* <p className={cn("text-[10px] mt-1", msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/80 text-left')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p> */}
              </div>
               {msg.sender === 'user' && (
                 <Avatar className="h-7 w-7 border self-end mb-0.5 bg-accent text-accent-foreground">
                   <AvatarFallback><User className="h-3 w-3"/></AvatarFallback>
                 </Avatar>
              )}
            </div>
          ))}
          {isReplying && (
             <div className="flex items-end gap-2 max-w-[85%] self-start mr-auto">
                <Avatar className="h-7 w-7 border self-end mb-0.5">
                  <AvatarImage src={BOT_AVATAR_URL} alt={BOT_NAME} data-ai-hint="robot AI"/>
                  <AvatarFallback><Bot className="h-3 w-3"/></AvatarFallback>
                </Avatar>
                <div className="p-2.5 rounded-lg shadow-sm bg-muted text-muted-foreground rounded-bl-none">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Escribe tu mensaje..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isReplying}
            className="flex-1 h-10 text-sm"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-10 w-10 rounded-lg" disabled={isReplying || !userInput.trim()}>
            {isReplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
