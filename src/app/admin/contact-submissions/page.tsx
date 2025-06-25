// src/app/admin/contact-submissions/page.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import type { ContactFormSubmission, User as StoredUserType } from '@/lib/types';
import { BugReport } from '@/actions/bugReportActions'; // Import BugReport from actions
import { 
  getContactFormSubmissionsAction, 
  markSubmissionAsActionReadAction, 
  deleteContactSubmissionAction,
  adminRespondToSubmissionAction
} from '@/actions/contactFormActions';
import {
  getBugReportsAction,
  markBugReportAsReadAction,
  deleteBugReportAction
} from '@/actions/bugReportActions';
import { Loader2, MailWarning, Trash2, Eye, CheckCircle2, RotateCcw, Send, CornerDownLeft, Bug } from 'lucide-react';
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
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startProcessingTransition] = useTransition();
  
  const [selectedItem, setSelectedItem] = useState<ContactFormSubmission | BugReport | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [adminUser, setAdminUser] = useState<StoredUserType | null>(null);

  const isBugReport = (item: any): item is BugReport => item && 'page_url' in item; // A more specific property for bug reports

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser: StoredUserType = JSON.parse(userJson);
        setAdminUser(parsedUser);
      } catch (error) {
        console.error("Error parsing admin user from localStorage", error);
        setAdminUser(null);
      }
    }
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSubmissions, fetchedBugReportsData] = await Promise.all([
        getContactFormSubmissionsAction(),
        getBugReportsAction({}) // Fetch all bug reports without pagination/filters for now
      ]);
      setSubmissions(fetchedSubmissions);
      setBugReports(fetchedBugReportsData.bugReports);
      window.dispatchEvent(new CustomEvent('navUpdateCounts'));
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los mensajes y reportes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsReadUnread = (item: ContactFormSubmission | BugReport) => {
    startProcessingTransition(async () => {
      let result;
      const newStatus = !item.is_read;
      if (isBugReport(item)) {
        result = await markBugReportAsReadAction(item.id, newStatus);
      } else {
        result = await markSubmissionAsActionReadAction(item.id, newStatus);
      }
      
      if (result.success) {
        toast({ title: "Estado Actualizado", description: result.message });
        fetchAllData();
        if (selectedItem?.id === item.id) {
          setSelectedItem(prev => prev ? { ...prev, is_read: newStatus } : null);
        }
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (item: ContactFormSubmission | BugReport) => {
    startProcessingTransition(async () => {
      let result;
      if (isBugReport(item)) {
        result = await deleteBugReportAction(item.id);
      } else {
        result = await deleteContactSubmissionAction(item.id);
      }

      if (result.success) {
        toast({ title: "Elemento Eliminado", description: result.message });
        fetchAllData();
        setIsViewModalOpen(false); 
        setSelectedItem(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const openViewModal = (item: ContactFormSubmission | BugReport) => {
    setSelectedItem(item);
    if (!isBugReport(item)) {
      setAdminResponseText(item.admin_notes || '');
    }
    setIsViewModalOpen(true);
    if (!item.is_read) {
      handleMarkAsReadUnread(item);
    }
  };

  const handleAdminRespond = async () => {
    if (!selectedItem || isBugReport(selectedItem) || !adminUser?.id || !adminResponseText.trim()) {
        toast({ title: "Datos incompletos", description: "La respuesta no puede estar vacía.", variant: "destructive" });
        return;
    }
    setIsResponding(true);
    const result = await adminRespondToSubmissionAction(selectedItem.id, adminUser.id, adminResponseText);
    setIsResponding(false);

    toast({
        title: result.success ? "Nota Guardada" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
        fetchAllData();
        setIsViewModalOpen(false);
    }
  };
  
  if (isLoading && submissions.length === 0 && bugReports.length === 0) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando mensajes y reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Contact Form Submissions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <MailWarning className="h-6 w-6 mr-2 text-primary" /> Mensajes de Contacto
            </CardTitle>
            <CardDescription>Gestiona los mensajes recibidos del formulario de contacto público.</CardDescription>
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm" disabled={isLoading || isProcessing}>
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading || isProcessing ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Respondido</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id} className={`${!sub.is_read ? 'font-semibold bg-primary/5' : ''}`}>
                      <TableCell className="text-center">
                        {!sub.is_read && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" title="No leído" />}
                      </TableCell>
                      <TableCell>{sub.name}</TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>{sub.subject}</TableCell>
                      <TableCell>{format(new Date(sub.submitted_at), "dd MMM yyyy", { locale: es })}</TableCell>
                      <TableCell>{sub.replied_at ? 'Sí' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openViewModal(sub)}><Eye className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar Mensaje?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sub)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : ( !isLoading && <p className="text-center text-muted-foreground py-4">No hay mensajes.</p> )}
        </CardContent>
      </Card>
      
      {/* Bug Reports Card */}
      <Card>
        <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
                <Bug className="h-6 w-6 mr-2 text-destructive" /> Reportes de Fallas
            </CardTitle>
            <CardDescription>Reportes de errores o sugerencias enviadas por los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
            {bugReports.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Página</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bugReports.map((report) => (
                                <TableRow key={report.id} className={`${!report.is_read ? 'font-semibold bg-destructive/5' : ''}`}>
                                    <TableCell className="text-center">
                                        {!report.is_read && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" title="No leído" />}
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{report.status}</Badge></TableCell>
                                    <TableCell>{report.name || 'Anónimo'}<br/><span className="text-xs text-muted-foreground">{report.email}</span></TableCell>
                                    <TableCell className="truncate max-w-xs">{report.page_url}</TableCell>
                                    <TableCell>{format(new Date(report.created_at), "dd MMM yyyy", { locale: es })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openViewModal(report)}><Eye className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar Reporte?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(report)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : ( !isLoading && <p className="text-center text-muted-foreground py-4">No hay reportes.</p> )}
        </CardContent>
      </Card>

      {/* Unified View/Response Modal */}
      {selectedItem && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isBugReport(selectedItem) ? `Reporte de ${selectedItem.name || 'Anónimo'}` : `Mensaje de: ${selectedItem.name}`}
              </DialogTitle>
              <DialogDescription>
                Enviado el {format(new Date(isBugReport(selectedItem) ? selectedItem.created_at : selectedItem.submitted_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {isBugReport(selectedItem) ? (
                <>
                  <p><strong>Estado:</strong> <Badge variant="default">{selectedItem.status}</Badge></p>
                  <p><strong>Usuario:</strong> {selectedItem.name} ({selectedItem.email})</p>
                  <p><strong>Página:</strong> <a href={selectedItem.page_url || ''} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{selectedItem.page_url}</a></p>
                  <div><p className="font-semibold">Descripción:</p><p className="pl-2 border-l-2">{selectedItem.description}</p></div>
                  {selectedItem.steps_to_reproduce && <div><p className="font-semibold">Pasos para reproducir:</p><p className="pl-2 border-l-2">{selectedItem.steps_to_reproduce}</p></div>}
                  {selectedItem.browser_device && <p><strong>Navegador/Dispositivo:</strong> {selectedItem.browser_device}</p>}
                  {selectedItem.admin_notes && <div><p className="font-semibold">Notas del Admin:</p><p className="pl-2 border-l-2 bg-muted/50 p-2 rounded">{selectedItem.admin_notes}</p></div>}
                </>
              ) : (
                <>
                  <p><strong>Contacto:</strong> {selectedItem.email} {selectedItem.phone && `| ${selectedItem.phone}`}</p>
                  <p><strong>Asunto:</strong> {selectedItem.subject || 'N/A'}</p>
                  <div><p className="font-semibold">Mensaje:</p><p className="pl-2 border-l-2">{selectedItem.message}</p></div>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="admin-response">Respuesta / Notas del Administrador</Label>
                    <Textarea id="admin-response" placeholder="Escribe tu respuesta o notas internas..." value={adminResponseText} onChange={(e) => setAdminResponseText(e.target.value)} rows={4} disabled={isResponding}/>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Cerrar</Button>
                {!isBugReport(selectedItem) && (
                  <Button onClick={handleAdminRespond} disabled={isResponding || !adminResponseText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Guardar Nota
                  </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    