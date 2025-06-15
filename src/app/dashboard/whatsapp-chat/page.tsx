// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle, UserCircle, AlertTriangle, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, Plan, ChatMessage } from '@/lib/types'; // Usaremos ChatMessage
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const ASSISTANT_BOT_ID = 'KONECTE_ASSISTANT_BOT'; // ID para el asistente de IA

export default function AiAssistantChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Usaremos ChatMessage
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    console.log('[AiAssistantChatPage DEBUG] Permission check useEffect triggered.');
    setIsCheckingPermission(true);
    setIsLoadingInitial(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);
        console.log('[AiAssistantChatPage DEBUG] Logged in user:', { id: user.id, name: user.name, planId: user.plan_id });

        if (user.plan_id) {
          console.log(`[AiAssistantChatPage DEBUG] User has plan_id: ${user.plan_id}. Fetching plan...`);
          getPlanByIdAction(user.plan_id).then(plan => {
            console.log('[AiAssistantChatPage DEBUG] Fetched plan details:', plan);
            if (plan?.whatsapp_bot_enabled === true) { // Mantenemos esta verificación, aunque el chat ya no es de WhatsApp
              setHasPermission(true);
              console.log('[AiAssistantChatPage DEBUG] Permission GRANTED based on plan (whatsapp_bot_enabled flag).');
            } else {
              setHasPermission(false);
              toast({ title: "Función no Habilitada", description: "El chat con el asistente IA no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
              console.log('[AiAssistantChatPage DEBUG] Permission DENIED. Plan whatsapp_bot_enabled is not true.');
            }
            setIsCheckingPermission(false);
            setIsLoadingInitial(false);
          }).catch(err => {
            console.error("[AiAssistantChatPage DEBUG] Error checking plan permission:", err);
            toast({ title: "Error de Plan", description: "No se pudo verificar el permiso de tu plan.", variant: "destructive" });
            setHasPermission(false);
            setIsCheckingPermission(false);
            setIsLoadingInitial(false);
          });
        } else {
          setHasPermission(false);
          toast({ title: "Función no Habilitada", description: "El chat con el asistente IA no está incluido en tu plan (sin plan asignado).", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
          setIsCheckingPermission(false);
          setIsLoadingInitial(false);
          console.log('[AiAssistantChatPage DEBUG] User has no plan_id. Permission DENIED.');
        }
      } catch (error) {
        console.error("[AiAssistantChatPage DEBUG] Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null); setHasPermission(false);
        setIsCheckingPermission(false); setIsLoadingInitial(false);
      }
    } else {
      setLoggedInUser(null); setHasPermission(false);
      setIsCheckingPermission(false); setIsLoadingInitial(false);
      console.log('[AiAssistantChatPage DEBUG] No loggedInUser in localStorage.');
    }
  }, [toast]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !loggedInUser?.id || !hasPermission) return;

    setIsSending(true);
    const userMessageContent = newMessage;
    setNewMessage('');

    const userMessageForUI: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: `ai-chat-${loggedInUser.id}`,
      sender_id: loggedInUser.id,
      receiver_id: ASSISTANT_BOT_ID,
      content: userMessageContent,
      created_at: new Date().toISOString(),
      sender: { id: loggedInUser.id, name: loggedInUser.name, avatarUrl: loggedInUser.avatarUrl }
    };
    setMessages(prev => [...prev, userMessageForUI]);
    console.log(`[AiAssistantChatPage DEBUG] Optimistic UI update for user message: "${userMessageContent}"`);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageContent, userId: loggedInUser.id }),
      });
      
      const result = await response.json();
      console.log('[AiAssistantChatPage DEBUG] API /api/assistant/chat response:', result);
      
      if (result.success && result.response) {
        const assistantMessageForUI: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          conversation_id: `ai-chat-${loggedInUser.id}`,
          sender_id: ASSISTANT_BOT_ID,
          receiver_id: loggedInUser.id,
          content: result.response,
          created_at: new Date().toISOString(),
          sender: { id: ASSISTANT_BOT_ID, name: "Asistente Konecte", avatarUrl: "/logo-konecte-ai-bot.png" }
        };
        setMessages(prev => [...prev, assistantMessageForUI]);
      } else {
        throw new Error(result.message || 'La IA no pudo responder.');
      }
    } catch (error: any) {
      console.error("[AiAssistantChatPage DEBUG] Error sending message to AI assistant:", error.message);
      toast({ title: 'Error de Comunicación con IA', description: error.message || 'No se pudo obtener respuesta del asistente.', variant: 'destructive' });
      // Optionally, add a system error message to the chat UI
      const systemErrorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversation_id: `ai-chat-${loggedInUser.id}`,
        sender_id: 'SYSTEM_ERROR', 
        receiver_id: loggedInUser.id,
        content: "Lo siento, tuve un problema al conectar con el asistente. Por favor, intenta de nuevo.",
        created_at: new Date().toISOString(),
        sender: {id: 'SYSTEM_ERROR', name: "Sistema"}
      };
      setMessages(prev => [...prev, systemErrorMessage]);
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoadingInitial || isCheckingPermission) { 
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando asistente y verificando permisos...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <CardTitle>Acceso Requerido</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Debes iniciar sesión para usar el chat con nuestro asistente.</p>
          <Button asChild>
            <Link href={`/auth/signin?redirect=${encodeURIComponent('/dashboard/whatsapp-chat')}`}>Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!hasPermission) {
     return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <CardTitle>Función No Habilitada</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">El chat con el asistente IA no está incluido en tu plan actual.</p>
          <Button asChild>
            <Link href="/plans">Ver Planes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const botName = "Asistente Konecte";
  const botAvatarUrl = "/logo-konecte-ai-bot.png"; 

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,6rem)-var(--dashboard-padding-y,3rem)-2rem)] shadow-xl rounded-xl border overflow-hidden">
      <CardHeader className="p-3 sm:p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Avatar className="h-10 w-10">
                <AvatarImage src={botAvatarUrl} alt={botName} data-ai-hint="robot bot"/>
                <AvatarFallback><Bot className="text-primary"/></AvatarFallback>
             </Avatar>
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">{botName}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Pregúntame sobre propiedades, la plataforma o el mercado inmobiliario.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && !isSending && (
              <div className="text-center py-10 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>Hola {loggedInUser.name.split(' ')[0]}, ¿cómo puedo ayudarte hoy?</p>
              </div>
          )}
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} currentUserId={loggedInUser.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            type="text"
            placeholder="Escribe tu pregunta aquí..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg" disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
