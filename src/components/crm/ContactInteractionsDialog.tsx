
// src/components/crm/ContactInteractionsDialog.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { addContactInteractionAction } from '@/actions/crmActions';
import InteractionListItem from './InteractionListItem';
import { Loader2, PlusCircle, History, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContactInteractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  interactions: Interaction[];
  onInteractionAdded: (interaction: Interaction) => void;
  isLoadingInteractions: boolean;
  userId: string | undefined;
}

export default function ContactInteractionsDialog({
  open,
  onOpenChange,
  contact,
  interactions,
  onInteractionAdded,
  isLoadingInteractions,
  userId,
}: ContactInteractionsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFollowUpDate, setShowFollowUpDate] = useState(false);

  const form = useForm<AddInteractionFormValues>({
    resolver: zodResolver(addInteractionFormSchema),
    defaultValues: {
      interaction_type: 'note',
      interaction_date: new Date().toISOString(), // Default to today
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
      form.setValue("follow_up_date", null); // Clear date if not needed
    }
  }, [followUpNeededValue, form]);


  useEffect(() => {
    if (open) {
      form.reset({ // Reset form when dialog opens
        interaction_type: 'note',
        interaction_date: new Date().toISOString(),
        subject: '',
        description: '',
        outcome: '',
        follow_up_needed: false,
        follow_up_date: null,
      });
      setShowFollowUpDate(false);
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
  
  if (!contact) return null;

  return (
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
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)} // Store as YYYY-MM-DD
                            placeholder="Elige fecha de seguimiento"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" disabled={isSubmitting} className="w-full">
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
                    <InteractionListItem key={interaction.id} interaction={interaction} />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
