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
import { useToast } from '@/hooks/use-toast'; // For potential errors

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
  const { toast } = useToast();

  // Simular llamada a una API que obtendría todas las conversaciones.
  // En un sistema real, esto vendría de un endpoint protegido de admin.
  async function fetchAllConversationsForAdmin() {
    setIsLoading(true);
    setError(null);
    try {
      // Esto es una simulación y no es seguro para producción.
      // En un entorno real, NUNCA importarías el store directamente en el cliente de admin.
      // Harías una llamada a una API route de admin protegida.
      const { getAllConversationsForAdmin, getUniquePhoneNumbersWithConversations } = await import('@/lib/whatsappBotStore');
      const allConvos = getAllConversationsForAdmin();
      const uniquePhones = getUniquePhoneNumbersWithConversations();
      
      setConversations(allConvos);
      setPhoneNumbers(uniquePhones);

      if (uniquePhones.length > 0 && !selectedTelefono) {
        setSelectedTelefono(uniquePhones[0]);
      }
    } catch (e: any) {
      console.error("Error fetching conversations for admin viewer:", e);
      setError("No se pudieron cargar las conversaciones. El almacén en memoria podría no estar disponible o la importación dinámica falló.");
      toast({ title: "Error de Carga", description: "No se pudieron cargar las conversaciones para el visor de administrador.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.role_id === 'admin') {
          setIsAdmin(true);
          fetchAllConversationsForAdmin();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta solo una vez al montar


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
            <MessageSquare className="h-6 w-6 mr-2 text-primary" /> Visor de Chats del Bot de WhatsApp (Admin)
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
                 <Button onClick={fetchAllConversationsForAdmin} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          ) : phoneNumbers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay conversaciones de WhatsApp para mostrar.</p>
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
                <Button onClick={fetchAllConversationsForAdmin} variant="outline" size="icon" title="Refrescar conversaciones">
                    <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin': ''}`} />
                </Button>
              </div>

              {selectedTelefono && (
                <Card className="border-primary/30">
                  <CardHeader className="bg-secondary/30 py-3 px-4">
                    <CardTitle className="text-lg">Chat con Usuario: {selectedTelefono}</CardTitle>
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
                            {msg.sender === 'user' ? <User className="h-6 w-6 text-primary self-start mb-1" /> : <Bot className="h-6 w-6 text-green-600 self-start mb-1" /> }
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
            <p className="mt-1">En un entorno real, este visor debería obtener datos de una API de administrador segura que consulte una base de datos persistente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
