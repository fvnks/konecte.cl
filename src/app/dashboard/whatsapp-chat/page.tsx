
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle, UserCircle, AlertTriangle, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { WhatsAppMessage, User as StoredUser, Plan } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions';

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // For initial page load and permission check
  const [isLoadingConversation, setIsLoadingConversation] = useState(false); // For fetching conversation specifically
  const [isSending, setIsSending] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log('[WhatsAppChatPage DEBUG] Permission check useEffect triggered.');
    setIsCheckingPermission(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);
        console.log('[WhatsAppChatPage DEBUG] Logged in user:', { id: user.id, name: user.name, phone: user.phone_number, planId: user.plan_id });
        if (!user.phone_number) {
          toast({ title: "Número Requerido", description: "Debes añadir un número de teléfono a tu perfil para usar el chat de WhatsApp.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/profile">Ir al Perfil</Link></Button> });
          setUserPhoneNumber(null);
          setHasPermission(false);
          setIsCheckingPermission(false);
          setIsLoadingInitial(false);
          console.log('[WhatsAppChatPage DEBUG] User has no phone number. Permission DENIED.');
          return;
        }
        setUserPhoneNumber(user.phone_number);
        console.log(`[WhatsAppChatPage DEBUG] User phone number set: ${user.phone_number}`);

        if (user.plan_id) {
          console.log(`[WhatsAppChatPage DEBUG] User has plan_id: ${user.plan_id}. Fetching plan...`);
          getPlanByIdAction(user.plan_id).then(plan => {
            console.log('[WhatsAppChatPage DEBUG] Fetched plan details:', plan);
            if (plan?.whatsapp_bot_enabled === true) {
              setHasPermission(true);
              console.log('[WhatsAppChatPage DEBUG] Permission GRANTED based on plan.');
            } else {
              setHasPermission(false);
              toast({ title: "Función no Habilitada", description: "El chat con el bot de WhatsApp no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
              console.log('[WhatsAppChatPage DEBUG] Permission DENIED. Plan whatsapp_bot_enabled is not true.');
            }
            setIsCheckingPermission(false);
            setIsLoadingInitial(false); 
          }).catch(err => {
            console.error("[WhatsAppChatPage DEBUG] Error checking plan permission:", err);
            toast({ title: "Error de Plan", description: "No se pudo verificar el permiso de tu plan.", variant: "destructive" });
            setHasPermission(false);
            setIsCheckingPermission(false);
            setIsLoadingInitial(false);
          });
        } else {
          setHasPermission(false);
          toast({ title: "Función no Habilitada", description: "El chat con el bot de WhatsApp no está incluido en tu plan (sin plan asignado).", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
          setIsCheckingPermission(false);
          setIsLoadingInitial(false);
          console.log('[WhatsAppChatPage DEBUG] User has no plan_id. Permission DENIED.');
        }
      } catch (error) {
        console.error("[WhatsAppChatPage DEBUG] Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null); setUserPhoneNumber(null); setHasPermission(false);
        setIsCheckingPermission(false); setIsLoadingInitial(false);
      }
    } else {
      setLoggedInUser(null); setUserPhoneNumber(null); setHasPermission(false);
      setIsCheckingPermission(false); setIsLoadingInitial(false);
      console.log('[WhatsAppChatPage DEBUG] No loggedInUser in localStorage.');
    }
  }, [toast]);

  const fetchConversation = useCallback(async (phone: string) => {
    console.log(`[WhatsAppChatPage DEBUG] fetchConversation called for phone: ${phone}`);
    setIsLoadingConversation(true);
    try {
      const response = await fetch(`/api/whatsapp-bot/conversation/${phone}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation. Status: ${response.status}`);
      }
      const data: WhatsAppMessage[] = await response.json();
      setMessages(data.sort((a, b) => a.timestamp - b.timestamp));
      console.log(`[WhatsAppChatPage DEBUG] Conversation fetched for ${phone}. Messages count: ${data.length}`);
    } catch (error: any) {
      console.error(`[WhatsAppChatPage DEBUG] Error fetching conversation for ${phone}:`, error.message);
      toast({ title: 'Error al Actualizar Chat', description: 'No se pudo actualizar la conversación.', variant: 'destructive' });
    } finally {
      setIsLoadingConversation(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log(`[WhatsAppChatPage DEBUG] Conversation Polling useEffect. isCheckingPermission: ${isCheckingPermission}, hasPermission: ${hasPermission}, userPhoneNumber: ${userPhoneNumber}`);
    if (!isCheckingPermission && hasPermission && userPhoneNumber) {
      console.log(`[WhatsAppChatPage DEBUG] Conditions met. Initial fetchConversation for ${userPhoneNumber}.`);
      fetchConversation(userPhoneNumber); // Initial fetch

      const intervalId = setInterval(() => {
        console.log(`[WhatsAppChatPage DEBUG] Interval: Calling fetchConversation for ${userPhoneNumber}.`);
        fetchConversation(userPhoneNumber);
      }, 7000); // Poll every 7 seconds

      return () => {
        console.log(`[WhatsAppChatPage DEBUG] Clearing interval for ${userPhoneNumber}.`);
        clearInterval(intervalId);
      };
    } else {
      console.log(`[WhatsAppChatPage DEBUG] Not setting up interval or initial fetch due to conditions not met.`);
    }
  }, [isCheckingPermission, hasPermission, userPhoneNumber, fetchConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userPhoneNumber || !hasPermission || !loggedInUser?.id) return;

    setIsSending(true);
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: WhatsAppMessage = {
      id: tempMessageId,
      telefono: userPhoneNumber,
      text: newMessage,
      sender: 'user',
      timestamp: Date.now(),
      status: 'pending_to_whatsapp',
    };
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    console.log(`[WhatsAppChatPage DEBUG] Optimistic UI update for message: "${messageToSend}" to ${userPhoneNumber}`);

    try {
      const response = await fetch('/api/whatsapp-bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: userPhoneNumber, text: messageToSend }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Respuesta de error no es JSON' }));
        console.error(`[WhatsAppChatPage DEBUG] API send-message failed. Status: ${response.status}, Error:`, errorData);
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[WhatsAppChatPage DEBUG] API send-message success. Result:', result);
      
      if (result.success && result.message) {
        setMessages(prev => prev.map(msg => msg.id === tempMessageId ? result.message : msg));
      } else {
        throw new Error(result.message || 'El servidor respondió pero falló al confirmar el envío.');
      }
    } catch (error: any) {
      console.error("[WhatsAppChatPage DEBUG] Error sending message via API:", error.message);
      toast({ title: 'Error al Enviar', description: error.message || 'No se pudo enviar el mensaje.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId)); // Revert optimistic
      setNewMessage(messageToSend); // Restore input
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
          <p className="mb-4">Debes iniciar sesión para usar el chat con nuestro asistente.</p>
          <Button asChild>
            <Link href={`/auth/signin?redirect=${encodeURIComponent('/dashboard/whatsapp-chat')}`}>Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!userPhoneNumber) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle>Número de Teléfono Requerido</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Necesitamos tu número de teléfono para conectar con el bot de WhatsApp.</p>
          <Button asChild>
            <Link href="/profile">Añadir Teléfono en mi Perfil</Link>
          </Button>
           <CardDescription className="text-xs mt-4">
            Asegúrate de que tu número incluya el código de país (ej: +569XXXXXXXX).
          </CardDescription>
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
          <p className="mb-4">El chat con el bot de WhatsApp no está incluido en tu plan actual.</p>
          <Button asChild>
            <Link href="/plans">Ver Planes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const botName = "Asistente Konecte";

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,6rem)-var(--dashboard-padding-y,3rem)-2rem)] shadow-xl rounded-xl border overflow-hidden">
      <CardHeader className="p-3 sm:p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Bot className="h-10 w-10 text-primary p-1.5 bg-primary/10 rounded-full border border-primary/20" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">{botName}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Conectado vía WhatsApp a {userPhoneNumber}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {(isLoadingConversation && messages.length === 0) ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando historial...</p>
             </div>
          ) : messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>No hay mensajes aún. ¡Envía el primero para iniciar la conversación con nuestro asistente!</p>
              </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                  msg.sender === 'user' ? "self-end flex-row-reverse ml-auto" : "self-start mr-auto"
                }`}
              >
                <div
                  className={`p-2.5 sm:p-3 rounded-xl shadow-md text-sm ${
                    msg.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-secondary text-secondary-foreground rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === 'user' ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                    }`}
                    title={new Date(msg.timestamp).toLocaleString()}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'user' && msg.status === 'pending_to_whatsapp' && <Loader2 className="inline-block ml-1 h-3 w-3 animate-spin" />}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <Input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || isLoadingConversation}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg" disabled={isSending || isLoadingConversation || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
    