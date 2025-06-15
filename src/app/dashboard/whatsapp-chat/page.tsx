
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, UserCircle, AlertTriangle, Bot, MessageSquare as MessageSquareIconLucide } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, Plan, ChatMessage, WhatsAppMessage } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BOT_SENDER_ID } from '@/lib/whatsappBotStore';

const BOT_DISPLAY_NAME = "Asistente Konecte";
const BOT_AVATAR_URL = `https://placehold.co/40x40/64B5F6/FFFFFF.png?text=${BOT_DISPLAY_NAME.substring(0,1)}`;

type LoadingStep = 'checkingPermissions' | 'loadingInitialConversation' | 'idle';

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('checkingPermissions');
  const [isLoadingConversationPoll, setIsLoadingConversationPoll] = useState(false); // For subsequent polls
  
  const [isSending, setIsSending] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  // isCheckingPermission is effectively replaced by loadingStep === 'checkingPermissions'

  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // This effect handles permission checking and initial user setup
    let active = true;
    if (!isClient) return;

    setLoadingStep('checkingPermissions');
    const userJson = localStorage.getItem('loggedInUser');

    const processUser = async () => {
      if (!userJson) {
        if (active) {
            setLoggedInUser(null); setHasPermission(false); setLoadingStep('idle');
        }
        return;
      }

      try {
        const user: StoredUser = JSON.parse(userJson);
        if (active) setLoggedInUser(user);

        if (!user.phone_number) {
          if (active) {
            toast({ title: "Teléfono Requerido", description: "Necesitas un número de teléfono en tu perfil para usar esta función.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/profile">Ir al Perfil</Link></Button> });
            setHasPermission(false); setLoadingStep('idle');
          }
          return;
        }

        if (user.plan_id) {
          try {
            const plan = await getPlanByIdAction(user.plan_id);
            if (active) {
              if (plan?.whatsapp_bot_enabled === true) {
                setHasPermission(true);
                setLoadingStep('loadingInitialConversation'); // Ready to load data
              } else {
                setHasPermission(false);
                toast({ title: "Función no Habilitada", description: "El chat con el bot no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
                setLoadingStep('idle');
              }
            }
          } catch (err) {
            if (active) {
              console.error("[WhatsAppChatPage DEBUG] Error checking plan permission:", err);
              toast({ title: "Error de Plan", description: "No se pudo verificar el permiso de tu plan.", variant: "destructive" });
              setHasPermission(false); setLoadingStep('idle');
            }
          }
        } else { // No plan_id
          if (active) {
            setHasPermission(false);
            toast({ title: "Función no Habilitada", description: "El chat con el bot no está incluido en tu plan (sin plan asignado).", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
            setLoadingStep('idle');
          }
        }
      } catch (error) { // Error parsing userJson
        if (active) {
          console.error("[WhatsAppChatPage DEBUG] Error parsing user from localStorage", error);
          localStorage.removeItem('loggedInUser');
          setLoggedInUser(null); setHasPermission(false); setLoadingStep('idle');
        }
      }
    };

    processUser();
    return () => { active = false; };
  }, [toast, isClient]);


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

  const fetchConversation = useCallback(async (isInitialFetch: boolean) => {
    if (!loggedInUser?.phone_number || !loggedInUser?.id || !hasPermission) {
      if (isInitialFetch) setLoadingStep('idle');
      return;
    }

    if (isInitialFetch) {
        // setLoadingStep('loadingInitialConversation') is already set by the permission effect
    } else {
        setIsLoadingConversationPoll(true);
    }

    try {
      const response = await fetch(`/api/whatsapp-bot/conversation/${encodeURIComponent(loggedInUser.phone_number)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WhatsAppChatPage DEBUG] Failed to fetch conversation. Status: ${response.status}. Body: ${errorText}`);
        if (isInitialFetch) toast({ title: "Error de Carga", description: "No se pudo cargar la conversación inicial.", variant: "destructive" });
        return; 
      }
      const fetchedWhatsAppMessages: WhatsAppMessage[] = await response.json();
      const transformedMessages = fetchedWhatsAppMessages.map(msg => transformWhatsAppMessageToUIChatMessage(msg, loggedInUser.id, loggedInUser));
      setMessages(transformedMessages);
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error in fetchConversation:", error.message);
       if (isInitialFetch) toast({ title: "Error de Carga", description: "Ocurrió un error al cargar la conversación.", variant: "destructive" });
    } finally {
      if (isInitialFetch) {
        setLoadingStep('idle');
      } else {
        setIsLoadingConversationPoll(false);
      }
    }
  }, [loggedInUser, hasPermission, transformWhatsAppMessageToUIChatMessage, toast]);


  useEffect(() => {
    let isMounted = true;
    if (isClient && loadingStep === 'loadingInitialConversation' && hasPermission && loggedInUser?.phone_number) {
      fetchConversation(true); // Initial fetch
    }

    // Setup polling if conditions are met and we are idle (meaning initial load attempt is done)
    if (isClient && loadingStep === 'idle' && hasPermission && loggedInUser?.phone_number && !intervalRef.current) {
        intervalRef.current = setInterval(async () => {
            if (isMounted && loggedInUser?.phone_number && hasPermission) {
                await fetchConversation(false); // Subsequent poll
            }
        }, 7000);
    } else if (loadingStep !== 'loadingInitialConversation' || !hasPermission || !loggedInUser?.phone_number) {
      // Clear interval if conditions are no longer met
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClient, loadingStep, hasPermission, loggedInUser, fetchConversation]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const localWhatsAppBotNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;
    const WHATSAPP_BOT_NUMBER_FALLBACK = "+56946725640"; 
    let finalBotNumber = localWhatsAppBotNumber || WHATSAPP_BOT_NUMBER_FALLBACK;
    
    if (!loggedInUser?.id || !loggedInUser.phone_number || !finalBotNumber || !hasPermission || !newMessage.trim()) {
      toast({ title: "No se puede enviar", description: "Asegúrate de haber iniciado sesión, tener un teléfono y permiso para usar el bot.", variant: "warning" });
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
  
  const botNumberForDisplay = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+56946725640 (Fallback)";

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
          {(isLoadingConversationPoll && messages.length === 0 && loadingStep === 'idle') && (
             <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Actualizando conversación...
            </div>
          )}
          {messages.length === 0 && !isLoadingConversationPoll && loadingStep === 'idle' && (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquareIconLucide className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
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
