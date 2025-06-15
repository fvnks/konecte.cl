
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, UserCircle, AlertTriangle, Bot, MessageSquare } from 'lucide-react'; // MessageSquare ya estaba
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, Plan, ChatMessage, WhatsAppMessage } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BOT_SENDER_ID } from '@/lib/whatsappBotStore'; // Importar el ID del bot

const BOT_DISPLAY_NAME = "Asistente Konecte"; // Cambiado para reflejar que es un asistente IA
const BOT_AVATAR_URL = "/logo-konecte-ai-bot.png";
const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setIsCheckingPermission(true);
    setIsLoadingInitial(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);

        if (!user.phone_number) {
            console.warn('[WhatsAppChatPage DEBUG] User does not have a phone_number in localStorage.');
            toast({ title: "Teléfono Requerido", description: "Necesitas un número de teléfono en tu perfil para usar esta función.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/profile">Ir al Perfil</Link></Button> });
            setHasPermission(false);
            setIsCheckingPermission(false);
            setIsLoadingInitial(false);
            return;
        }

        if (user.plan_id) {
          getPlanByIdAction(user.plan_id).then(plan => {
            if (plan?.whatsapp_bot_enabled === true) {
              setHasPermission(true);
            } else {
              setHasPermission(false);
              toast({ title: "Función no Habilitada", description: "El chat con el bot no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
            }
            setIsCheckingPermission(false);
          }).catch(err => {
            console.error("[WhatsAppChatPage DEBUG] Error checking plan permission:", err);
            toast({ title: "Error de Plan", description: "No se pudo verificar el permiso de tu plan.", variant: "destructive" });
            setHasPermission(false);
            setIsCheckingPermission(false);
            setIsLoadingInitial(false);
          });
        } else {
          setHasPermission(false);
          toast({ title: "Función no Habilitada", description: "El chat con el bot no está incluido en tu plan (sin plan asignado).", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
          setIsCheckingPermission(false);
          setIsLoadingInitial(false);
        }
      } catch (error) {
        console.error("[WhatsAppChatPage DEBUG] Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null); setHasPermission(false);
        setIsCheckingPermission(false); setIsLoadingInitial(false);
      }
    } else {
      setLoggedInUser(null); setHasPermission(false);
      setIsCheckingPermission(false); setIsLoadingInitial(false);
    }
  }, [toast]);

  const transformWhatsAppMessageToUIChatMessage = useCallback((msg: WhatsAppMessage, currentUserId: string, currentUserDetails: StoredUser | null): ChatMessage => {
    const isFromCurrentUser = msg.sender_id_override === currentUserId;
    
    let senderName: string;
    let senderAvatar: string | undefined | null = undefined;
    let finalSenderId: string;

    if (isFromCurrentUser) {
        senderName = currentUserDetails?.name || "Tú";
        senderAvatar = currentUserDetails?.avatarUrl;
        finalSenderId = currentUserId;
    } else { // Mensaje del Bot (via `receive-reply`)
        senderName = BOT_DISPLAY_NAME;
        senderAvatar = BOT_AVATAR_URL;
        finalSenderId = BOT_SENDER_ID;
    }
    
    return {
      id: msg.id,
      conversation_id: msg.telefono, // La clave de la conversación es el telefono del usuario web
      sender_id: finalSenderId,
      receiver_id: isFromCurrentUser ? BOT_SENDER_ID : currentUserId,
      content: msg.text,
      created_at: new Date(msg.timestamp).toISOString(),
      sender: {
        id: finalSenderId,
        name: senderName,
        avatarUrl: senderAvatar,
      },
    };
  }, []);


  const fetchConversation = useCallback(async () => {
    if (!loggedInUser?.phone_number || !loggedInUser?.id || !hasPermission) {
      if (isLoadingInitial && !isCheckingPermission) setIsLoadingInitial(false);
      setIsLoadingConversation(false);
      return;
    }
    if (!isLoadingInitial && !isLoadingConversation) setIsLoadingConversation(true);

    try {
      const response = await fetch(`/api/whatsapp-bot/conversation/${encodeURIComponent(loggedInUser.phone_number)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WhatsAppChatPage DEBUG] Failed to fetch conversation. Status: ${response.status}. Body: ${errorText}`);
        throw new Error(`Failed to fetch conversation for ${loggedInUser.phone_number}, server responded with ${response.status}`);
      }
      const fetchedWhatsAppMessages: WhatsAppMessage[] = await response.json();
      const transformedMessages = fetchedWhatsAppMessages.map(msg => transformWhatsAppMessageToUIChatMessage(msg, loggedInUser.id, loggedInUser));
      setMessages(transformedMessages);
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error in fetchConversation:", error.message);
    } finally {
      setIsLoadingConversation(false);
      if (isLoadingInitial) setIsLoadingInitial(false);
    }
  }, [loggedInUser, hasPermission, transformWhatsAppMessageToUIChatMessage, isLoadingInitial]);

  useEffect(() => {
    if (!isCheckingPermission && hasPermission && loggedInUser?.phone_number && loggedInUser?.id) {
      fetchConversation();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchConversation, 7000);
    } else {
       if (isLoadingInitial && !isCheckingPermission) setIsLoadingInitial(false);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCheckingPermission, hasPermission, loggedInUser, fetchConversation, isLoadingInitial]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !loggedInUser?.id || !loggedInUser.phone_number || !WHATSAPP_BOT_NUMBER || !hasPermission) {
        toast({ title: "Error", description: "No se puede enviar el mensaje. Verifica tu sesión o número de teléfono.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    const userMessageContent = newMessage;
    setNewMessage('');

    const optimisticMessageForUI: ChatMessage = transformWhatsAppMessageToUIChatMessage({
        id: `temp-user-${Date.now()}`,
        telefono: loggedInUser.phone_number, // La clave de la conversación es el teléfono del usuario
        text: userMessageContent,
        sender: 'user',
        timestamp: Date.now(),
        status: 'pending_to_whatsapp',
        sender_id_override: loggedInUser.id,
      }, loggedInUser.id, loggedInUser);

    setMessages(prev => [...prev, optimisticMessageForUI]);
    
    try {
      const payloadForApi = {
        telefonoReceptorBot: WHATSAPP_BOT_NUMBER,
        text: userMessageContent,
        telefonoRemitenteUsuarioWeb: loggedInUser.phone_number,
        userId: loggedInUser.id,
      };
      const response = await fetch('/api/whatsapp-bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForApi),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'El sistema no pudo procesar el mensaje para el bot.');
      }
       // No es necesario actualizar messages aquí si el polling se encarga.
       // Se podría actualizar el status del mensaje optimista si la API devolviera el ID real.
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error sending message via API:", error.message);
      toast({ title: 'Error de Envío', description: error.message || 'No se pudo enviar tu mensaje al bot.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageForUI.id)); // Revertir UI optimista
      setNewMessage(userMessageContent); // Restaurar texto
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoadingInitial || isCheckingPermission) { 
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando chat y verificando permisos...</p>
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
          <p className="mb-4">Debes iniciar sesión para usar el chat con nuestro bot.</p>
          <Button asChild>
            <Link href={`/auth/signin?redirect=${encodeURIComponent('/dashboard/whatsapp-chat')}`}>Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!hasPermission || !loggedInUser.phone_number) {
     return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <CardTitle>Función No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-1">El chat con el bot de WhatsApp no está habilitado para tu cuenta o falta tu número de teléfono.</p>
          {!loggedInUser.phone_number && <p className="text-sm text-muted-foreground mb-3">Por favor, <Link href="/profile" className="underline text-primary">añade un número de teléfono a tu perfil</Link>.</p>}
          {loggedInUser.phone_number && !hasPermission && <p className="text-sm text-muted-foreground mb-3">Considera mejorar tu plan para acceder a esta función.</p>}
          <Button asChild>
            <Link href="/plans">Ver Planes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,6rem)-var(--dashboard-padding-y,3rem)-2rem)] shadow-xl rounded-xl border overflow-hidden">
      <CardHeader className="p-3 sm:p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Avatar className="h-10 w-10">
                <AvatarImage src={BOT_AVATAR_URL} alt={BOT_DISPLAY_NAME} data-ai-hint="robot bot"/>
                <AvatarFallback><Bot className="text-primary"/></AvatarFallback>
             </Avatar>
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">{BOT_DISPLAY_NAME}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Interactuando con el bot de WhatsApp {WHATSAPP_BOT_NUMBER}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {(isLoadingConversation && messages.length === 0 && !isLoadingInitial) && (
             <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Cargando conversación...
            </div>
          )}
          {messages.length === 0 && !isLoadingConversation && !isLoadingInitial && (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>Hola {loggedInUser.name.split(' ')[0]}, envía un mensaje para iniciar la conversación con el bot.</p>
              </div>
          )}
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} currentUserId={loggedInUser!.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            type="text"
            placeholder="Escribe tu mensaje para el bot..."
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
