// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, UserCircle, AlertTriangle, Bot, MessageSquare as MessageSquareIconLucide } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, ChatMessage, WhatsAppMessage } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BOT_SENDER_ID } from '@/lib/whatsappBotStore';

const BOT_DISPLAY_NAME = "Asistente Konecte";
const BOT_AVATAR_URL = `https://placehold.co/40x40/64B5F6/FFFFFF.png?text=AI`;

type LoadingStep = 'checkingPermissions' | 'loadingInitialConversation' | 'idle';

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('checkingPermissions');
  
  const [isSending, setIsSending] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const { toast } = useToast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const transformWhatsAppMessageToUIChatMessage = useCallback((msg: WhatsAppMessage, currentUserId: string, currentUserDetails: StoredUser | null): ChatMessage => {
    const isFromCurrentUser = msg.sender_id_override === currentUserId;
    let senderName: string;
    let senderAvatar: string | undefined | null = null;
    let finalSenderId: string;

    if (isFromCurrentUser) {
        senderName = currentUserDetails?.name || "Tú";
        senderAvatar = currentUserDetails?.avatarUrl;
        finalSenderId = currentUserId;
    } else { 
        senderName = BOT_DISPLAY_NAME;
        senderAvatar = BOT_AVATAR_URL;
        finalSenderId = BOT_SENDER_ID;
    }
    
    return {
      id: msg.id,
      conversation_id: msg.telefono, 
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

  const fetchConversation = useCallback(async (isInitialFetch: boolean = false) => {
    if (!loggedInUser?.phone_number || !loggedInUser?.id || !hasPermission) {
      if (isInitialFetch) setLoadingStep('idle');
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp-bot/conversation/${encodeURIComponent(loggedInUser.phone_number)}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar la conversación.");
      }
      const fetchedWhatsAppMessages: WhatsAppMessage[] = await response.json();
      const transformedMessages = fetchedWhatsAppMessages.map(msg => transformWhatsAppMessageToUIChatMessage(msg, loggedInUser.id, loggedInUser));
      
      setMessages(prevMessages => {
        if(JSON.stringify(prevMessages) !== JSON.stringify(transformedMessages)){
          return transformedMessages;
        }
        return prevMessages;
      });

    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error in fetchConversation:", error.message);
      if (isInitialFetch) toast({ title: "Error de Carga", description: error.message, variant: "destructive" });
    } finally {
      if (isInitialFetch) {
        setLoadingStep('idle');
      }
    }
  }, [loggedInUser, hasPermission, transformWhatsAppMessageToUIChatMessage, toast]);

  // Effect 1: Load user from local storage ONCE.
  useEffect(() => {
    if (isClient) {
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
          try {
              const user: StoredUser = JSON.parse(userJson);
              setLoggedInUser(user);
              setHasPermission(user.plan_automated_alerts_enabled === true);
          } catch (e) {
              console.error("Error parsing user from localStorage:", e);
              setLoggedInUser(null);
              setHasPermission(false);
          }
      }
      setLoadingStep('idle'); // We are done checking auth, move to next step
    }
  }, [isClient]);

  // Effect 2: Run checks and start fetching/polling when user state is confirmed.
  useEffect(() => {
    if (loadingStep !== 'idle') {
        return; // Don't run this effect until initial auth check is done.
    }
    
    // Cleanup previous interval if this effect re-runs
    if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
    }

    if (loggedInUser) {
        if (!hasPermission) {
             const reason = loggedInUser.plan_id ? "El chat con el bot no está incluido en tu plan actual." : "Necesitas un plan para usar esta función.";
             toast({ title: "Función No Habilitada", description: reason, variant: "warning", duration: 7000 });
             return; // Stop here
        }

        if (!loggedInUser.phone_number) {
            toast({ title: "Teléfono Requerido", description: "Necesitas un número de teléfono en tu perfil para usar el chat.", variant: "warning", duration: 7000 });
            setHasPermission(false); // Revoke permission if no phone
            return; // Stop here
        }
        
        // All checks passed, start fetching and polling
        setLoadingStep('loadingInitialConversation');
        fetchConversation(true); // Initial fetch
        
        pollingIntervalRef.current = setInterval(() => {
          fetchConversation(false);
        }, 3000);
    }
    
    // Cleanup function for this effect
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, hasPermission, loadingStep, toast]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const finalBotNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;
    
    if (!loggedInUser?.id || !loggedInUser.phone_number || !finalBotNumber || !hasPermission || !newMessage.trim()) {
      toast({ title: "No se puede enviar", description: "Verifica tu sesión, plan y que hayas escrito un mensaje.", variant: "warning" });
      return;
    }

    setIsSending(true);
    const userMessageContent = newMessage;
    setNewMessage('');
    
    const optimisticMessageForUI: ChatMessage = transformWhatsAppMessageToUIChatMessage({
        id: `temp-user-${Date.now()}`,
        telefono: loggedInUser.phone_number, 
        text: userMessageContent,
        sender: 'user',
        timestamp: Date.now(),
        status: 'pending_to_whatsapp',
        sender_id_override: loggedInUser.id,
      }, loggedInUser.id, loggedInUser);

    setMessages(prev => [...prev, optimisticMessageForUI]);
    
    try {
      const payloadForApi = {
        telefonoReceptorBot: finalBotNumber,
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
      if (!result.success) throw new Error(result.message || 'El sistema no pudo procesar el mensaje para el bot.');
      
      // Trigger an immediate fetch after sending to get bot's potential quick reply
      setTimeout(() => fetchConversation(false), 500);

    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error sending message via API:", error.message);
      toast({ title: 'Error de Envío', description: error.message || 'No se pudo enviar tu mensaje al bot.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageForUI.id));
      setNewMessage(userMessageContent); 
    } finally {
      setIsSending(false);
    }
  };
  
  if (loadingStep === 'checkingPermissions') { 
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }
  
  if (loadingStep === 'loadingInitialConversation' && messages.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando conversación...</p>
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
  
  if (!hasPermission) {
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
  
  const botNumberForDisplay = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "N/A";

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
            <CardDescription className="text-xs sm:text-sm">Interactuando con el bot en {botNumberForDisplay}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && loadingStep === 'idle' && (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquareIconLucide className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>Hola {loggedInUser.name.split(' ')[0]}, envía un mensaje para iniciar la conversación con el bot.</p>
              </div>
          )}
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} currentUserId={loggedInUser!.id} />
          ))}
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
          <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg" 
            disabled={isSending || !newMessage.trim() || !loggedInUser?.phone_number || !hasPermission}
            title={
              !loggedInUser?.phone_number ? "Añade un teléfono a tu perfil" :
              !hasPermission ? "Tu plan no incluye esta función" :
              "Enviar mensaje"
            }
            >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
