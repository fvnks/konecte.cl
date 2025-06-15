
// src/app/admin/whatsapp-viewer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, Bot, User, AlertTriangle } from 'lucide-react';
import type { WhatsAppMessage } from '@/lib/types';
import { Button } from '@/components/ui/button'; // For refresh
import Link from 'next/link'; // For login button

interface AdminConversationStore {
  [telefono: string]: WhatsAppMessage[];
}

export default function AdminWhatsAppViewerPage() {
  const [conversations, setConversations] = useState<AdminConversationStore>({});
  const [selectedTelefono, setSelectedTelefono] = useState<string>('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Simular llamada a una API que obtendría todas las conversaciones.
  // En un sistema real, esto vendría de un endpoint protegido.
  // Para este prototipo, usaremos una función simulada que importa el store.
  async function fetchAllConversationsFromStore() {
    setIsLoading(true);
    setError(null);
    try {
      // Esto es una simulación. En un entorno real, NUNCA importarías el store así en el cliente.
      // Harías una llamada a una API route de admin.
      const { getAllConversationsForAdmin, getUniquePhoneNumbersWithConversations } = await import('@/lib/whatsappBotStore');
      setConversations(getAllConversationsForAdmin());
      setPhoneNumbers(getUniquePhoneNumbersWithConversations());
      if (getUniquePhoneNumbersWithConversations().length > 0 && !selectedTelefono) {
        setSelectedTelefono(getUniquePhoneNumbersWithConversations()[0]);
      }
    } catch (e: any) {
      console.error("Error fetching conversations for admin:", e);
      setError("No se pudieron cargar las conversaciones. El almacén en memoria podría no estar disponible en este contexto de cliente directo.");
      toast({ title: "Error", description: "No se pudieron cargar las conversaciones.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Temporal: Añadir toast para la simulación
  const { toast } = (typeof window !== "undefined" ? require('@/hooks/use-toast') : { toast: () => {} });


  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.role_id === 'admin') {
          setIsAdmin(true);
          fetchAllConversationsFromStore();
        } else {
          setIsAdmin(false);
          setError("Acceso denegado. Esta sección es solo para administradores.");
          setIsLoading(false);
        }
      } catch (e) {
        setIsAdmin(false);
        setError("Error al verificar la sesión. Por favor, inicia sesión de nuevo.");
        setIsLoading(false);
      }
    } else {
      setIsAdmin(false);
      setError("Debes iniciar sesión como administrador para ver esta página.");
      setIsLoading(false);
    }
  }, []);


  const selectedConversation = conversations[selectedTelefono] || [];

  if (!isAdmin && !isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="mb-4">{error || "No tienes permisos para acceder a esta sección."}</p>
            <Button asChild>
                <Link href="/auth/signin">Iniciar Sesión como Administrador</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-primary" /> Visor de Chats del Bot de WhatsApp
          </CardTitle>
          <CardDescription>
            Visualiza las conversaciones entre los usuarios y el bot de WhatsApp. (Solo lectura)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Cargando conversaciones...</p>
            </div>
          ) : error ? (
             <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Error al Cargar Datos</p>
                <p className="text-sm">{error}</p>
                 <Button onClick={fetchAllConversationsFromStore} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          ) : phoneNumbers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay conversaciones para mostrar.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="telefono-select" className="text-sm font-medium">Seleccionar Conversación (Teléfono):</label>
                <Select value={selectedTelefono} onValueChange={setSelectedTelefono}>
                  <SelectTrigger id="telefono-select" className="w-full max-w-xs">
                    <SelectValue placeholder="Elige un número" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers.map(tel => (
                      <SelectItem key={tel} value={tel}>{tel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={fetchAllConversationsFromStore} variant="outline" size="icon" title="Refrescar conversaciones">
                    <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`} />
                </Button>
              </div>

              {selectedTelefono && (
                <Card className="border-primary/30">
                  <CardHeader className="bg-secondary/30 py-3 px-4">
                    <CardTitle className="text-lg">Chat con: {selectedTelefono}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px] p-4">
                      {selectedConversation.length > 0 ? (
                        selectedConversation.sort((a,b) => a.timestamp - b.timestamp).map(msg => (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 my-2 max-w-[85%] ${
                              msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            }`}
                          >
                            <div className={`p-2.5 rounded-lg shadow ${
                              msg.sender === 'user'
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted text-muted-foreground rounded-bl-none"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender === 'user' ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left"
                              }`}>
                                {new Date(msg.timestamp).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-6">No hay mensajes en esta conversación.</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-300 text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5"/>Nota Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-yellow-600 dark:text-yellow-400">
            <p>Este visor de chat utiliza un almacenamiento en memoria temporal. Los mensajes se perderán si el servidor de la aplicación se reinicia.</p>
            <p className="mt-1">Para una solución de producción, deberás integrar una base de datos persistente para almacenar los mensajes del bot de WhatsApp.</p>
        </CardContent>
      </Card>
    </div>
  );
}
