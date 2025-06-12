// src/components/crm/ContactInteractionsDialog.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addInteractionFormSchema, type AddInteractionFormValues, type Interaction, type Contact, interactionTypeOptions } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { addContactInteractionAction, deleteInteractionAction } from '@/actions/crmActions';
import InteractionListItem from './InteractionListItem';
import { Loader2, PlusCircle, History, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogPrimitiveTitle,
} from "@/components/ui/alert-dialog";
import EditInteractionDialog from './EditInteractionDialog'; // Importar el nuevo diálogo

interface ContactInteractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  interactions: Interaction[];
  onInteractionAdded: (interaction: Interaction) => void;
  onInteractionDeleted: (interactionId: string) => void;
  onInteractionUpdated: (updatedInteraction: Interaction) => void;
  isLoadingInteractions: boolean;
  userId: string | undefined;
}

export default function ContactInteractionsDialog({
  open,
  onOpenChange,
  contact,
  interactions,
  onInteractionAdded,
  onInteractionDeleted,
  onInteractionUpdated,
  isLoadingInteractions,
  userId,
}: ContactInteractionsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFollowUpDate, setShowFollowUpDate] = useState(false);

  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [interactionToDeleteId, setInteractionToDeleteId] = useState<string | null>(null);
  const [isDeleteInteractionAlertOpen, setIsDeleteInteractionAlertOpen] = useState(false);

  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [isEditInteractionDialogOpen, setIsEditInteractionDialogOpen] = useState(false);

  const form = useForm<AddInteractionFormValues>({
    resolver: zodResolver(addInteractionFormSchema),
    defaultValues: {
      interaction_type: 'note',
      interaction_date: new Date().toISOString(),
      subject: '',
      description: '',
      outcome: '',
      follow_up_needed: false,
      follow_up_date: null,
    },
  });

  const followUpNeededValue = form.watch("follow_up_needed");

  useEffect(() => {
    setShowFollowUpDate(!!followUpNeededValue);
    if (!followUpNeededValue) {
      form.setValue("follow_up_date", null);
    }
  }, [followUpNeededValue, form]);


  useEffect(() => {
    if (open) {
      form.reset({
        interaction_type: 'note',
        interaction_date: new Date().toISOString(),
        subject: '',
        description: '',
        outcome: '',
        follow_up_needed: false,
        follow_up_date: null,
      });
      setShowFollowUpDate(false);
      setEditingInteraction(null); 
      setIsEditInteractionDialogOpen(false);
    }
  }, [open, form]);

  async function onSubmit(values: AddInteractionFormValues) {
    if (!contact || !userId) {
      toast({ title: 'Error', description: 'No se pudo identificar el contacto o usuario.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await addContactInteractionAction(contact.id, userId, values);
    setIsSubmitting(false);

    if (result.success && result.interaction) {
      toast({ title: 'Interacción Añadida', description: 'La nueva interacción ha sido registrada.' });
      onInteractionAdded(result.interaction);
      form.reset({
        interaction_type: 'note',
        interaction_date: new Date().toISOString(),
        subject: '',
        description: '',
        outcome: '',
        follow_up_needed: false,
        follow_up_date: null,
      });
      setShowFollowUpDate(false);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo añadir la interacción.', variant: 'destructive' });
    }
  }

  const handleDeleteInteractionRequest = (interactionId: string) => {
    setInteractionToDeleteId(interactionId);
    setIsDeleteInteractionAlertOpen(true);
  };

  const handleConfirmDeleteInteraction = async () => {
    if (!interactionToDeleteId || !userId || !contact?.id) return;

    setIsDeleteInteractionAlertOpen(false);
    startDeleteTransition(async () => {
      const result = await deleteInteractionAction(interactionToDeleteId, userId, contact.id);
      if (result.success) {
        toast({
          title: 'Interacción Eliminada',
          description: result.message || 'La interacción ha sido eliminada.',
        });
        onInteractionDeleted(interactionToDeleteId);
      } else {
        toast({
          title: 'Error al Eliminar Interacción',
          description: result.message || 'No se pudo eliminar la interacción.',
          variant: 'destructive',
        });
      }
      setInteractionToDeleteId(null);
    });
  };

  const handleEditInteractionRequest = (interactionToEdit: Interaction) => {
    setEditingInteraction(interactionToEdit);
    setIsEditInteractionDialogOpen(true);
  };

  const handleLocalInteractionUpdated = (updatedInteraction: Interaction) => {
    onInteractionUpdated(updatedInteraction); 
    setIsEditInteractionDialogOpen(false);
    setEditingInteraction(null);
  };


  if (!contact) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <History className="mr-2 h-5 w-5 text-primary" />
              Interacciones con: {contact.name}
            </DialogTitle>
            <DialogDescription>
              Añade y visualiza el historial de comunicaciones y seguimientos con este contacto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
            {/* Form Section */}
            <div className="flex flex-col space-y-4 overflow-hidden">
              <h3 className="text-lg font-semibold border-b pb-2">Añadir Nueva Interacción</h3>
              <ScrollArea className="flex-grow pr-3">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="interaction_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Interacción *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {interactionTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interaction_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Interacción *</FormLabel>
                            <DatePicker
                              value={field.value ? new Date(field.value) : null}
                              onChange={(date) => field.onChange(date?.toISOString())}
                            />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto (Opcional)</FormLabel>
                          <FormControl><Input placeholder="Ej: Propuesta enviada, Llamada de seguimiento" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción / Notas *</FormLabel>
                          <FormControl><Textarea placeholder="Detalles de la interacción..." {...field} className="min-h-[100px]" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="outcome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resultado (Opcional)</FormLabel>
                          <FormControl><Input placeholder="Ej: Interesado, Pide más info" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="follow_up_needed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="font-normal mb-0! mt-0!">¿Requiere Seguimiento?</FormLabel>
                        </FormItem>
                      )}
                    />
                    {showFollowUpDate && (
                      <FormField
                        control={form.control}
                        name="follow_up_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Seguimiento</FormLabel>
                             <DatePicker
                              value={field.value ? new Date(field.value) : null}
                              onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                              placeholder="Elige fecha de seguimiento"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <Button type="submit" disabled={isSubmitting || isPendingDelete} className="w-full">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      Añadir Interacción
                    </Button>
                  </form>
                </Form>
              </ScrollArea>
            </div>

            {/* Interactions List Section */}
            <div className="flex flex-col space-y-3 overflow-hidden">
              <h3 className="text-lg font-semibold border-b pb-2">Historial de Interacciones ({interactions.length})</h3>
              {isLoadingInteractions ? (
                <div className="flex flex-col items-center justify-center flex-grow text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2">Cargando interacciones...</p>
                </div>
              ) : interactions.length > 0 ? (
                <ScrollArea className="flex-grow pr-1">
                  <div className="space-y-3">
                    {interactions.map(interaction => (
                      <InteractionListItem
                        key={interaction.id}
                        interaction={interaction}
                        onDeleteRequest={handleDeleteInteractionRequest}
                        onEditRequest={handleEditInteractionRequest} // Pasar la función para editar
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center text-muted-foreground p-4 border-2 border-dashed rounded-md">
                  <AlertTriangle className="h-10 w-10 mb-2" />
                  <p className="font-medium">No hay interacciones registradas.</p>
                  <p className="text-sm">Añade la primera interacción usando el formulario.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPendingDelete}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {interactionToDeleteId && (
         <AlertDialog open={isDeleteInteractionAlertOpen} onOpenChange={setIsDeleteInteractionAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogPrimitiveTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      Confirmar Eliminación de Interacción
                  </AlertDialogPrimitiveTitle>
                  <AlertDialogDescription>
                      ¿Estás seguro de que quieres eliminar esta interacción? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteInteractionAlertOpen(false)} disabled={isPendingDelete}>
                    Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDeleteInteraction} disabled={isPendingDelete} className="bg-destructive hover:bg-destructive/90">
                    {isPendingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Sí, Eliminar Interacción
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {editingInteraction && isEditInteractionDialogOpen && contact && (
        <EditInteractionDialog
          open={isEditInteractionDialogOpen}
          onOpenChange={setIsEditInteractionDialogOpen}
          interaction={editingInteraction}
          contactId={contact.id}
          userId={userId}
          onInteractionUpdated={handleLocalInteractionUpdated}
        />
      )}
    </>
  );
}
