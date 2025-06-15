
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, UserCircle, AlertTriangle, Bot, MessageSquare } from 'lucide-react'; // Added MessageSquare
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, Plan, ChatMessage, WhatsAppMessage } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions';
import ChatMessageItem from '@/components/chat/ChatMessageItem'; // Generic enough
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BOT_SENDER_ID } from '@/lib/whatsappBotStore';

const BOT_DISPLAY_NAME = "Bot Asistente Konecte";
const BOT_AVATAR_URL = "/logo-konecte-ai-bot.png";

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
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
    console.log('[WhatsAppChatPage DEBUG] Permission check useEffect triggered.');
    setIsCheckingPermission(true);
    setIsLoadingInitial(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);
        console.log('[WhatsAppChatPage DEBUG] Logged in user:', { id: user.id, name: user.name, planId: user.plan_id, phoneNumber: user.phone_number });

        if (user.phone_number) {
            setUserPhoneNumber(user.phone_number);
            console.log(`[WhatsAppChatPage DEBUG] User phone number set: ${user.phone_number}`);
        } else {
            console.warn('[WhatsAppChatPage DEBUG] User does not have a phone_number in localStorage.');
            toast({ title: "Teléfono Requerido", description: "Necesitas un número de teléfono en tu perfil para usar esta función.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/profile">Ir al Perfil</Link></Button> });
        }

        if (user.plan_id) {
          console.log(`[WhatsAppChatPage DEBUG] User has plan_id: ${user.plan_id}. Fetching plan...`);
          getPlanByIdAction(user.plan_id).then(plan => {
            console.log('[WhatsAppChatPage DEBUG] Fetched plan details:', plan);
            if (plan?.whatsapp_bot_enabled === true) {
              setHasPermission(true);
              console.log('[WhatsAppChatPage DEBUG] Permission GRANTED based on plan.');
            } else {
              setHasPermission(false);
              toast({ title: "Función no Habilitada", description: "El chat con el bot no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
              console.log('[WhatsAppChatPage DEBUG] Permission DENIED. Plan whatsapp_bot_enabled is not true.');
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
          console.log('[WhatsAppChatPage DEBUG] User has no plan_id. Permission DENIED.');
        }
      } catch (error) {
        console.error("[WhatsAppChatPage DEBUG] Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null); setHasPermission(false); setUserPhoneNumber(null);
        setIsCheckingPermission(false); setIsLoadingInitial(false);
      }
    } else {
      setLoggedInUser(null); setHasPermission(false); setUserPhoneNumber(null);
      setIsCheckingPermission(false); setIsLoadingInitial(false);
      console.log('[WhatsAppChatPage DEBUG] No loggedInUser in localStorage.');
    }
  }, [toast]);

  const transformWhatsAppMessageToChatMessage = useCallback((msg: WhatsAppMessage, currentUserId: string): ChatMessage => {
    let senderIdToUse = msg.sender_id_override;
    let senderNameToUse: string;
    let senderAvatarToUse: string | undefined | null = undefined;

    if (msg.sender === 'user') {
        senderIdToUse = currentUserId; // Always use loggedInUser.id for messages sent by the user from the web UI
        senderNameToUse = loggedInUser?.name || "Tú";
        senderAvatarToUse = loggedInUser?.avatarUrl;
    } else { // sender === 'bot'
        senderIdToUse = BOT_SENDER_ID;
        senderNameToUse = BOT_DISPLAY_NAME;
        senderAvatarToUse = BOT_AVATAR_URL;
    }

    return {
      id: msg.id,
      conversation_id: msg.telefono,
      sender_id: senderIdToUse,
      receiver_id: msg.sender === 'user' ? BOT_SENDER_ID : currentUserId,
      content: msg.text,
      created_at: new Date(msg.timestamp).toISOString(),
      sender: {
        id: senderIdToUse,
        name: senderNameToUse,
        avatarUrl: senderAvatarToUse,
      },
    };
  }, [loggedInUser]);


  const fetchConversation = useCallback(async () => {
    if (!userPhoneNumber || !loggedInUser?.id || !hasPermission) {
      console.log(`[WhatsAppChatPage DEBUG] fetchConversation: Aborted. Conditions not met. userPhoneNumber: ${userPhoneNumber}, loggedInUser.id: ${loggedInUser?.id}, hasPermission: ${hasPermission}`);
      if (isLoadingInitial) setIsLoadingInitial(false);
      return;
    }
    console.log(`[WhatsAppChatPage DEBUG] fetchConversation called for phone: ${userPhoneNumber}`);
    setIsLoadingConversation(true);
    try {
      const response = await fetch(`/api/whatsapp-bot/conversation/${encodeURIComponent(userPhoneNumber)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WhatsAppChatPage DEBUG] Failed to fetch conversation. Status: ${response.status}. Body: ${errorText}`);
        throw new Error(`Failed to fetch conversation, server responded with ${response.status}`);
      }
      const fetchedWhatsAppMessages: WhatsAppMessage[] = await response.json();
      const transformedMessages = fetchedWhatsAppMessages.map(msg => transformWhatsAppMessageToChatMessage(msg, loggedInUser.id));
      setMessages(transformedMessages);
      console.log(`[WhatsAppChatPage DEBUG] Conversation fetched for ${userPhoneNumber}. Messages count: ${transformedMessages.length}`);
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error in fetchConversation:", error.message);
    } finally {
      setIsLoadingConversation(false);
      if (isLoadingInitial) setIsLoadingInitial(false);
    }
  }, [userPhoneNumber, loggedInUser, hasPermission, transformWhatsAppMessageToChatMessage, isLoadingInitial]);

  useEffect(() => {
    if (!isCheckingPermission && hasPermission && userPhoneNumber && loggedInUser?.id) {
      console.log(`[WhatsAppChatPage DEBUG] Permissions OK. Initial fetchConversation for ${userPhoneNumber}.`);
      fetchConversation();

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        console.log(`[WhatsAppChatPage DEBUG] Interval: Calling fetchConversation for ${userPhoneNumber}.`);
        fetchConversation();
      }, 7000);
      console.log(`[WhatsAppChatPage DEBUG] Interval set for ${userPhoneNumber}.`);
    } else {
      console.log(`[WhatsAppChatPage DEBUG] Not setting interval. isCheckingPermission: ${isCheckingPermission}, hasPermission: ${hasPermission}, userPhoneNumber: ${userPhoneNumber}`);
       if (isLoadingInitial && !isCheckingPermission) setIsLoadingInitial(false);
    }
    return () => {
      if (intervalRef.current) {
        console.log(`[WhatsAppChatPage DEBUG] Clearing interval on unmount/re-run for ${userPhoneNumber}.`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCheckingPermission, hasPermission, userPhoneNumber, loggedInUser, fetchConversation, isLoadingInitial]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !loggedInUser?.id || !userPhoneNumber || !hasPermission) return;

    setIsSending(true);
    const userMessageContent = newMessage;
    setNewMessage('');

    const optimisticChatMessage: ChatMessage = transformWhatsAppMessageToChatMessage({
      id: `temp-user-${Date.now()}`,
      telefono: userPhoneNumber,
      text: userMessageContent,
      sender: 'user', // From the user via web UI
      timestamp: Date.now(),
      status: 'pending_to_whatsapp',
      sender_id_override: loggedInUser.id, // The actual user ID
    }, loggedInUser.id);

    setMessages(prev => [...prev, optimisticChatMessage]);
    console.log(`[WhatsAppChatPage DEBUG] Optimistic UI update for message: "${userMessageContent}" to ${userPhoneNumber}`);

    try {
      const response = await fetch('/api/whatsapp-bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: userPhoneNumber, text: userMessageContent, userId: loggedInUser.id }),
      });
      
      const result = await response.json();
      console.log('[WhatsAppChatPage DEBUG] API /api/whatsapp-bot/send-message response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'El bot no pudo procesar el mensaje.');
      }
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error sending message via API:", error.message);
      toast({ title: 'Error de Envío', description: error.message || 'No se pudo enviar tu mensaje al bot.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticChatMessage.id));
      setNewMessage(userMessageContent);
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoadingInitial) { 
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
  
  if (!hasPermission || !userPhoneNumber) {
     return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <CardTitle>Función No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-1">El chat con el bot de WhatsApp no está habilitado para tu cuenta o falta tu número de teléfono.</p>
          {!userPhoneNumber && <p className="text-sm text-muted-foreground mb-3">Por favor, <Link href="/profile" className="underline text-primary">añade un número de teléfono a tu perfil</Link>.</p>}
          {userPhoneNumber && !hasPermission && <p className="text-sm text-muted-foreground mb-3">Considera mejorar tu plan para acceder a esta función.</p>}
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
            <CardDescription className="text-xs sm:text-sm">Conectado a tu WhatsApp: {userPhoneNumber}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoadingConversation && messages.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Cargando conversación...
            </div>
          )}
          {messages.length === 0 && !isLoadingConversation && (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>Hola {loggedInUser.name.split(' ')[0]}, envía un mensaje para iniciar la conversación con el bot en tu WhatsApp.</p>
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

