
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle, UserCircle, AlertTriangle, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { WhatsAppMessage, User as StoredUser, Plan } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPlanByIdAction } from '@/actions/planActions'; // Para verificar permiso del plan

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);
        if (!user.phone_number) {
          toast({ title: "Número Requerido", description: "Debes añadir un número de teléfono a tu perfil para usar el chat de WhatsApp.", variant: "warning", duration: 7000 });
          setIsCheckingPermission(false);
          setIsLoading(false);
          return;
        }
        setUserPhoneNumber(user.phone_number);

        // Verificar permiso del plan
        if (user.plan_id) {
          getPlanByIdAction(user.plan_id).then(plan => {
            if (plan?.whatsapp_bot_enabled) {
              setHasPermission(true);
            } else {
              toast({ title: "Función no Habilitada", description: "El chat con el bot de WhatsApp no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
            }
            setIsCheckingPermission(false);
          }).catch(err => {
            console.error("Error checking plan permission:", err);
            toast({ title: "Error", description: "No se pudo verificar el permiso de tu plan.", variant: "destructive" });
            setIsCheckingPermission(false);
          });
        } else { // No plan_id means default (likely free) plan, assume no permission
          toast({ title: "Función no Habilitada", description: "El chat con el bot de WhatsApp no está incluido en tu plan actual.", variant: "warning", duration: 7000, action: <Button asChild variant="link"><Link href="/plans">Ver Planes</Link></Button> });
          setIsCheckingPermission(false);
        }

      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setIsCheckingPermission(false);
        setIsLoading(false);
      }
    } else {
      setIsCheckingPermission(false);
      setIsLoading(false); // No user logged in
    }
  }, [toast]);
  
  useEffect(() => {
    if (userPhoneNumber && hasPermission && !isCheckingPermission) {
      const fetchConversation = async () => {
        if (!isLoading) setIsLoading(true); // Solo activar loader si no está ya cargando por otra razón
        try {
          const response = await fetch(`/api/whatsapp-bot/conversation/${userPhoneNumber}`);
          if (!response.ok) {
            throw new Error('Failed to fetch conversation');
          }
          const data: WhatsAppMessage[] = await response.json();
          setMessages(data.sort((a, b) => a.timestamp - b.timestamp));
        } catch (error) {
          console.error("Error fetching conversation:", error);
          toast({
            title: 'Error al Cargar Chat',
            description: 'No se pudo cargar la conversación inicial.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchConversation();

      const intervalId = setInterval(fetchConversation, 7000); // Poll every 7 seconds
      return () => clearInterval(intervalId);
    } else if (!isCheckingPermission && !hasPermission) {
        setIsLoading(false); // Si no hay permiso, no hay nada que cargar
    }
  }, [userPhoneNumber, hasPermission, isCheckingPermission, toast, isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userPhoneNumber || !hasPermission) return;

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

    try {
      const response = await fetch('/api/whatsapp-bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: userPhoneNumber, text: messageToSend }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      const result = await response.json();
      
      if (result.success && result.message) {
        setMessages(prev => prev.map(msg => msg.id === tempMessageId ? result.message : msg));
      } else {
        throw new Error(result.message || 'Server responded but failed to confirm message send.');
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({ title: 'Error', description: error.message || 'No se pudo enviar el mensaje.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  if (isCheckingPermission || (isLoading && (!userPhoneNumber || !hasPermission))) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Verificando acceso y cargando chat...</p>
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
            <Link href="/auth/signin?redirect=/dashboard/whatsapp-chat">Iniciar Sesión</Link>
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
            <CardDescription className="text-xs sm:text-sm">Conectado vía WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoading && messages.length === 0 ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : messages.length === 0 && !isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400"/>
                <p>No hay mensajes aún. ¡Envía el primero!</p>
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
            disabled={isSending || isLoading}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg" disabled={isSending || isLoading || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}

