
// src/app/dashboard/messages/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Added missing import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, UserCircle, Inbox, AlertTriangle } from 'lucide-react';
import type { ChatConversationListItem, User as StoredUserType } from '@/lib/types';
import { getUserConversationsAction } from '@/actions/chatActions';
import { useToast } from '@/hooks/use-toast';
import ConversationListItem from '@/components/chat/ConversationListItem';
import StyledRefreshButton from '@/components/ui/StyledRefreshButton'; 

export default function MessagesPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [conversations, setConversations] = useState<ChatConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, startRefreshingTransition] = useTransition();
  const { toast } = useToast();

  const fetchConversations = async (userId: string) => {
    if (isRefreshing) return; 
    if (!isLoading) setIsLoading(true); 

    try {
      const fetchedConversations = await getUserConversationsAction(userId);
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: 'Error al Cargar Mensajes',
        description: 'No se pudieron obtener tus conversaciones. Intenta de nuevo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUserType = JSON.parse(userJson);
        setLoggedInUser(user);
        fetchConversations(user.id);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleRefresh = () => {
    if (loggedInUser?.id) {
        startRefreshingTransition(() => {
            setIsLoading(true); 
            fetchConversations(loggedInUser.id);
        });
    }
  };


  if (isLoading && conversations.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus mensajes...</p>
      </div>
    );
  }

  if (!loggedInUser && !isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <UserCircle className="h-8 w-8 mr-3 text-primary" />
            Acceso Requerido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-xl font-semibold mb-2">Debes iniciar sesión para ver tus mensajes.</p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline flex items-center">
              <MessageSquare className="h-7 w-7 mr-3 text-primary" />
              Mis Mensajes
            </CardTitle>
            <CardDescription>Aquí encontrarás todas tus conversaciones.</CardDescription>
          </div>
           <StyledRefreshButton 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
            aria-label="Refrescar conversaciones"
           />
        </CardHeader>
        <CardContent>
          {isLoading && conversations.length > 0 && ( 
             <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Actualizando...
            </div>
          )}
          {!isLoading && conversations.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No tienes mensajes.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando inicies o recibas una conversación, aparecerá aquí.
              </p>
              <Button asChild variant="link" className="mt-4">
                <Link href="/properties">Explorar Propiedades</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <ConversationListItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

