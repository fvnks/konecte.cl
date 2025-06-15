
// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle, UserCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { WhatsAppMessage, User as StoredUser } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WhatsAppChatPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        if (user.phone_number) {
          setUserPhoneNumber(user.phone_number);
        } else {
          setIsLoading(false);
          // El usuario no tiene número de teléfono, se manejará en el render.
        }
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // No user logged in
    }
  }, []);
  
  // Fetch initial conversation and set up polling
  useEffect(() => {
    if (userPhoneNumber) {
      const fetchConversation = async () => {
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

      const intervalId = setInterval(fetchConversation, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId);
    }
  }, [userPhoneNumber, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userPhoneNumber) return;

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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando chat...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <Card>
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
      <Card>
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
  
  // Placeholder for bot's avatar/name if needed
  const botName = "Asistente Konecte";
  const botAvatarFallback = "AK";

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,6rem)-var(--dashboard-padding-y,3rem)-2rem)] shadow-xl rounded-xl border overflow-hidden">
      <CardHeader className="p-3 sm:p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <UserCircle className="h-10 w-10 text-primary" /> {/* Icono simple para el bot */}
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">{botName}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Conectado vía WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
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
          ))}
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
