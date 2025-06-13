
// src/app/dashboard/messages/[conversationId]/page.tsx
'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, UserCircle, AlertTriangle } from 'lucide-react';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import ChatHeader from '@/components/chat/ChatHeader';
import type { ChatMessage, User as StoredUserType, ChatConversationListItem } from '@/lib/types';
import { getConversationMessagesAction, sendMessageAction, getUserConversationsAction } from '@/actions/chatActions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [otherUser, setOtherUser] = useState<StoredUserType | null>(null);
  const [conversationContext, setConversationContext] = useState<Pick<ChatConversationListItem, 'context_title' | 'context_slug' | 'context_type'> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
  }, []);

  useEffect(() => {
    if (loggedInUser?.id && conversationId) {
      setIsLoading(true);
      Promise.all([
        getConversationMessagesAction(conversationId, loggedInUser.id),
        getUserConversationsAction(loggedInUser.id)
      ]).then(([fetchedMessages, userConversations]) => {
        setMessages(fetchedMessages);
        const currentConvoDetails = userConversations.find(c => c.id === conversationId);
        if (currentConvoDetails?.other_user) {
          setOtherUser(currentConvoDetails.other_user as StoredUserType); // Cast as StoredUserType for simplicity
          setConversationContext({
            context_title: currentConvoDetails.context_title,
            context_slug: currentConvoDetails.context_slug,
            context_type: currentConvoDetails.context_type,
          });
        }
      }).catch(error => {
        console.error("Error fetching conversation data:", error);
        toast({
          title: 'Error al Cargar Chat',
          description: 'No se pudo cargar la conversación.',
          variant: 'destructive',
        });
      }).finally(() => {
        setIsLoading(false);
        // Notify Navbar/DashboardLayout to update unread counts potentially
        window.dispatchEvent(new CustomEvent('messagesUpdated'));
      });
    }
  }, [loggedInUser, conversationId, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !loggedInUser?.id || !otherUser?.id) return;

    setIsSending(true);
    const tempMessageId = `temp-${Date.now()}`; // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      conversation_id: conversationId,
      sender_id: loggedInUser.id,
      receiver_id: otherUser.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: { id: loggedInUser.id, name: loggedInUser.name, avatarUrl: loggedInUser.avatarUrl }
    };
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const result = await sendMessageAction(conversationId, loggedInUser.id, otherUser.id, messageToSend);
      if (result.success && result.chatMessage) {
        setMessages(prev => prev.map(msg => msg.id === tempMessageId ? result.chatMessage! : msg));
         // Notify Navbar/DashboardLayout to update unread counts potentially
        window.dispatchEvent(new CustomEvent('messagesUpdated'));
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo enviar el mensaje.', variant: 'destructive' });
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId)); // Revert optimistic update
        setNewMessage(messageToSend); // Restore input
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: 'Error', description: 'Ocurrió un error al enviar el mensaje.', variant: 'destructive' });
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader otherUser={otherUser} conversationContext={conversationContext} />
        <div className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Cargando mensajes...</p>
        </div>
      </div>
    );
  }
  
  if (!loggedInUser && !isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-4">Debes iniciar sesión para ver esta conversación.</p>
        <Button asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,6rem)-var(--dashboard-padding-y,3rem))] border rounded-lg shadow-xl bg-card overflow-hidden">
      <ChatHeader otherUser={otherUser} conversationContext={conversationContext}/>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
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
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || !loggedInUser || !otherUser}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg" disabled={isSending || !newMessage.trim() || !loggedInUser || !otherUser}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar Mensaje</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
