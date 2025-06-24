// src/app/dashboard/whatsapp-chat/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, AlertTriangle, Bot, MessageSquare, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User as StoredUser, ChatMessage, WhatsAppMessage } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { getWhatsappConversationAction, sendWhatsappMessageAction } from '@/actions/whatsappActions';
import { BOT_SENDER_ID } from '@/lib/whatsappBotStore';

const BOT_DISPLAY_NAME = "Asistente Konecte";
const BOT_AVATAR_URL = `https://placehold.co/40x40/64B5F6/FFFFFF.png?text=AI`;

type PageStatus = 'loading' | 'error' | 'ready' | 'permission_denied';

export default function WhatsAppChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [isSending, startSendingTransition] = useTransition();
  const [isRefreshing, startRefreshingTransition] = useTransition();
  
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loggedInUserRef = useRef<StoredUser | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
      }
    }, 100);
  }, []);

  const transformToChatMessage = useCallback((msg: WhatsAppMessage, currentUser: StoredUser): ChatMessage => {
    const isFromCurrentUser = msg.sender === 'user' || msg.sender_id_override === currentUser.id;
    return {
      id: msg.id.toString(),
      conversation_id: msg.telefono,
      sender_id: isFromCurrentUser ? currentUser.id : BOT_SENDER_ID,
      receiver_id: isFromCurrentUser ? BOT_SENDER_ID : currentUser.id,
      content: msg.text,
      created_at: new Date(msg.timestamp).toISOString(),
      sender: {
        id: isFromCurrentUser ? currentUser.id : BOT_SENDER_ID,
        name: isFromCurrentUser ? currentUser.name : BOT_DISPLAY_NAME,
        avatarUrl: isFromCurrentUser ? currentUser.avatarUrl : BOT_AVATAR_URL,
      },
    };
  }, []);

  const loadConversation = useCallback(async () => {
    if (!loggedInUserRef.current) {
        setStatus('permission_denied');
        setErrorMessage('Debes iniciar sesión para ver esta página.');
        return;
    }
    
    if (status !== 'ready') {
        setStatus('loading');
    }

    const result = await getWhatsappConversationAction(loggedInUserRef.current.id);

    if (result.success && result.data) {
      const transformed = result.data.map(m => transformToChatMessage(m, loggedInUserRef.current!));
      setMessages(transformed);
      setStatus('ready');
      scrollToBottom();
    } else {
      setErrorMessage(result.message || 'Error desconocido.');
      setStatus(result.message?.includes('plan') || result.message?.includes('teléfono') ? 'permission_denied' : 'error');
    }
  }, [transformToChatMessage, scrollToBottom, status]);
  
  const handleRefresh = () => {
      startRefreshingTransition(async () => {
          await loadConversation();
          toast({ title: "Conversación actualizada" });
      });
  };

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      loggedInUserRef.current = user;
      loadConversation();
    } else {
      setStatus('permission_denied');
      setErrorMessage('Debes iniciar sesión para ver esta página.');
    }
  }, []);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const currentUser = loggedInUserRef.current;
    if (!currentUser || !newMessage.trim()) return;

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: currentUser.phone_number!,
      sender_id: currentUser.id,
      receiver_id: BOT_SENDER_ID,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    scrollToBottom();

    startSendingTransition(async () => {
      const result = await sendWhatsappMessageAction(currentUser.id, messageToSend);
      if (!result.success) {
        toast({ title: 'Error al enviar', description: result.message, variant: 'destructive' });
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        setNewMessage(messageToSend);
      } else {
        await loadConversation();
      }
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
      
      case 'permission_denied':
      case 'error':
        return (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            {errorMessage.includes('plan') && 
              <Button asChild className="mt-4"><Link href="/plans">Ver Planes</Link></Button>
            }
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Bot className="h-7 w-7 text-primary" />
                    <div>
                        <h2 className="text-lg font-semibold">{BOT_DISPLAY_NAME}</h2>
                        <p className="text-xs text-muted-foreground">Chatea con nuestro asistente de IA</p>
                    </div>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </header>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map(msg => <ChatMessageItem key={msg.id} message={msg} currentUserId={loggedInUserRef.current!.id} />)}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="h-[calc(100vh-4rem)] shadow-lg">
      <CardContent className="h-full p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
