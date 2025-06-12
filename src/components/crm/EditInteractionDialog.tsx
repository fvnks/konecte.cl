// src/components/crm/EditInteractionDialog.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { editInteractionFormSchema, type EditInteractionFormValues, type Interaction, interactionTypeOptions } from '@/lib/types';
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
import { DatePicker } from '@/components/ui/date-picker'; // Asumiendo que existe este componente
import { useToast } from '@/hooks/use-toast';
import { updateContactInteractionAction } from '@/actions/crmActions';
import { Loader2, Edit3, Save } from 'lucide-react';

interface EditInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction: Interaction | null;
  contactId: string;
  userId: string | undefined;
  onInteractionUpdated: (updatedInteraction: Interaction) => void;
}

export default function EditInteractionDialog({
  open,
  onOpenChange,
  interaction,
  contactId,
  userId,
  onInteractionUpdated,
}: EditInteractionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFollowUpDate, setShowFollowUpDate] = useState(false);

  const form = useForm<EditInteractionFormValues>({
    resolver: zodResolver(editInteractionFormSchema),
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
    if (interaction && open) {
      form.reset({
        interaction_type: interaction.interaction_type,
        interaction_date: interaction.interaction_date, // Debe ser un string ISO para el DatePicker
        subject: interaction.subject || '',
        description: interaction.description,
        outcome: interaction.outcome || '',
        follow_up_needed: interaction.follow_up_needed || false,
        follow_up_date: interaction.follow_up_date || null, // Debe ser string ISO o null
      });
      setShowFollowUpDate(!!interaction.follow_up_needed);
    } else if (!open) {
        form.reset({ // Reset a valores por defecto si se cierra
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
  }, [interaction, open, form]);

  async function onSubmit(values: EditInteractionFormValues) {
    if (!interaction || !userId) {
      toast({ title: 'Error', description: 'No se pudo identificar la interacción, contacto o usuario.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const result = await updateContactInteractionAction(interaction.id, userId, contactId, values);
    setIsSubmitting(false);

    if (result.success && result.interaction) {
      toast({ title: 'Interacción Actualizada', description: 'La interacción ha sido actualizada exitosamente.' });
      onInteractionUpdated(result.interaction);
      onOpenChange(false); // Close dialog
    } else {
      toast({ title: 'Error al Actualizar', description: result.message || 'No se pudo actualizar la interacción.', variant: 'destructive' });
    }
  }

  if (!interaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Editar Interacción
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de la interacción con {interaction.contact_name || 'el contacto'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-3 pl-1">
            <FormField
              control={form.control}
              name="interaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Interacción *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !userId || !interaction}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
