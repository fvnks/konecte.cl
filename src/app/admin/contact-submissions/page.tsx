// src/app/admin/contact-submissions/page.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import type { ContactFormSubmission, User as StoredUserType } from '@/lib/types';
import { 
  getContactFormSubmissionsAction, 
  markSubmissionAsActionReadAction, 
  deleteContactSubmissionAction,
  adminRespondToSubmissionAction
} from '@/actions/contactFormActions';
import { Loader2, MailWarning, Trash2, Eye, CheckCircle2, RotateCcw, Send, CornerDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminContactSubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startProcessingTransition] = useTransition();
  
  const [selectedSubmission, setSelectedSubmission] = useState<ContactFormSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [adminUser, setAdminUser] = useState<StoredUserType | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredUserType = JSON.parse(userJson);
        if (parsedUser && parsedUser.id) {
          setAdminUser(parsedUser);
        } else {
          setAdminUser(null);
          console.warn("Admin user data from localStorage is missing an ID.");
        }
      } catch (error) {
        console.error("Error parsing admin user from localStorage", error);
        setAdminUser(null);
      }
    }
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const fetchedSubmissions = await getContactFormSubmissionsAction();
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los mensajes de contacto.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleMarkAsReadUnread = async (submissionId: string, currentStatus: boolean) => {
    startProcessingTransition(async () => {
      const result = await markSubmissionAsActionReadAction(submissionId, !currentStatus);
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        fetchSubmissions(); 
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(prev => prev ? { ...prev, is_read: !currentStatus } : null);
        }
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    startProcessingTransition(async () => {
      const result = await deleteContactSubmissionAction(submissionId);
      if (result.success) {
        toast({ title: "Mensaje Eliminado", description: result.message });
        fetchSubmissions(); 
        setIsViewModalOpen(false); 
        setSelectedSubmission(null);
      } else {
        toast({ title: "Error al Eliminar", description: result.message, variant: "destructive" });
      }
    });
  };

  const openViewModal = (submission: ContactFormSubmission) => {
    setSelectedSubmission(submission);
    setAdminResponseText(''); 
    setIsViewModalOpen(true);
    if (!submission.is_read) {
      handleMarkAsReadUnread(submission.id, false);
    }
  };

  const handleAdminRespond = async () => {
    if (!selectedSubmission || !adminUser?.id || !adminResponseText.trim()) {
        toast({ title: "Datos incompletos", description: "Por favor, escribe una respuesta o verifica tu sesión.", variant: "destructive" });
        return;
    }
    setIsResponding(true);
    const result = await adminRespondToSubmissionAction(selectedSubmission.id, adminUser.id, adminResponseText);
    setIsResponding(false);

    const toastTitle = result.success 
        ? (result.chatSent ? "Respuesta Enviada" : "Nota Guardada") 
        : "Error al Procesar";

    toast({
        title: toastTitle,
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
        setAdminResponseText('');
        fetchSubmissions(); 
        // No necesitamos actualizar selectedSubmission aquí porque el modal se cerrará
        setIsViewModalOpen(false); // Cerrar el modal automáticamente
    }
  };
  
  if (isLoading && submissions.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando mensajes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <MailWarning className="h-6 w-6 mr-2 text-primary" /> Mensajes del Formulario de Contacto
            </CardTitle>
            <CardDescription>Gestiona los mensajes recibidos a través del formulario de contacto público.</CardDescription>
          </div>
          <Button onClick={fetchSubmissions} variant="outline" size="sm" disabled={isLoading || isProcessing}>
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading || isProcessing ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && submissions.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de mensajes...</p>}
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Fecha Envío</TableHead>
                    <TableHead>Respondido</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id} className={`${!sub.is_read ? 'font-semibold bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'} ${sub.replied_at ? 'opacity-70' : ''}`}>
                      <TableCell className="text-center">
                        {!sub.is_read && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" title="No leído" />}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={sub.name}>{sub.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sub.email}>{sub.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sub.subject || ''}>{sub.subject || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(sub.submitted_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.replied_at ? format(new Date(sub.replied_at), "dd MMM yy", { locale: es }) : 'No'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openViewModal(sub)} title="Ver y Responder Mensaje">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" disabled={isProcessing} title="Eliminar Mensaje">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Eliminarás permanentemente el mensaje de "{sub.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSubmission(sub.id)} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Sí, eliminar mensaje
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay mensajes de contacto recibidos.</p>
          )}
        </CardContent>
      </Card>

      {selectedSubmission && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Mensaje de: {selectedSubmission.name}</DialogTitle>
              <DialogDescription>
                Enviado el {format(new Date(selectedSubmission.submitted_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                {selectedSubmission.replied_at && ` | Respondido el ${format(new Date(selectedSubmission.replied_at), "dd MMM yy", { locale: es })}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-3">
              <p><strong className="font-medium">Email:</strong> {selectedSubmission.email}</p>
              {selectedSubmission.phone && <p><strong className="font-medium">Teléfono:</strong> {selectedSubmission.phone}</p>}
              {selectedSubmission.subject && <p><strong className="font-medium">Asunto:</strong> {selectedSubmission.subject}</p>}
              <div>
                <strong className="font-medium block mb-1">Mensaje Original:</strong>
                <Textarea value={selectedSubmission.message} readOnly className="min-h-[100px] bg-muted/50" />
              </div>
              {selectedSubmission.admin_notes && (
                <div>
                  <strong className="font-medium block mb-1">Última Respuesta/Nota del Admin:</strong>
                  <Textarea value={selectedSubmission.admin_notes} readOnly className="min-h-[80px] bg-muted/30 italic" />
                </div>
              )}
              <div className="space-y-1.5 pt-3 border-t">
                <Label htmlFor="admin-response" className="font-medium">Escribir Respuesta / Nota Interna:</Label>
                <Textarea
                    id="admin-response"
                    placeholder={!adminUser?.id ? "Inicia sesión como admin para responder." : "Escribe tu respuesta aquí. Si el email del remitente está registrado, se enviará como un mensaje de chat..."}
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isResponding || !adminUser?.id}
                />
                {!adminUser?.id && <p className="text-xs text-destructive">Debes estar logueado como admin para responder o tu sesión es inválida.</p>}
              </div>
            </div>
            <DialogFooter className="sm:justify-between gap-2 flex-wrap">
              <Button 
                variant={selectedSubmission.is_read ? "outline" : "default"} 
                size="sm"
                onClick={() => handleMarkAsReadUnread(selectedSubmission.id, selectedSubmission.is_read)} 
                disabled={isProcessing || isResponding}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {selectedSubmission.is_read ? "Marcar No Leído" : "Marcar Leído"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)} disabled={isResponding}>Cerrar</Button>
                <Button 
                    size="sm" 
                    onClick={handleAdminRespond} 
                    disabled={isResponding || !adminResponseText.trim() || !adminUser?.id}
                    className="bg-primary hover:bg-primary/90"
                >
                    {isResponding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Enviar Respuesta / Guardar Nota
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
