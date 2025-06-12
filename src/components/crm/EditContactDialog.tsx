// src/components/crm/EditContactDialog.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { editContactFormSchema, type EditContactFormValues, contactStatusOptions, type Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // No trigger needed as it's controlled externally
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
import { useToast } from '@/hooks/use-toast';
import { updateContactAction } from '@/actions/crmActions';
import { Loader2, Edit3, UserCheck } from 'lucide-react';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactUpdated: (contact: Contact) => void;
  userId: string | undefined;
  initialData: Contact | null;
}

export default function EditContactDialog({
  open,
  onOpenChange,
  onContactUpdated,
  userId,
  initialData,
}: EditContactDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditContactFormValues>({
    resolver: zodResolver(editContactFormSchema),
    defaultValues: initialData || { // Initialize with default or empty strings
      name: '',
      email: '',
      phone: '',
      company_name: '',
      status: 'new',
      source: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company_name: initialData.company_name || '',
        status: initialData.status || 'new',
        source: initialData.source || '',
        notes: initialData.notes || '',
      });
    } else if (!open) {
      form.reset(); // Reset form when dialog is closed
    }
  }, [initialData, open, form]);


  async function onSubmit(values: EditContactFormValues) {
    if (!userId) {
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo identificar al usuario.',
        variant: 'destructive',
      });
      onOpenChange(false);
      return;
    }
    if (!initialData?.id) {
      toast({
        title: 'Error Interno',
        description: 'No se pudo identificar el contacto a editar.',
        variant: 'destructive',
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    const result = await updateContactAction(initialData.id, values, userId);
    setIsSubmitting(false);

    if (result.success && result.contact) {
      toast({
        title: 'Contacto Actualizado',
        description: `El contacto "${result.contact.name}" ha sido actualizado.`,
      });
      onContactUpdated(result.contact);
      onOpenChange(false); // Close dialog on success
    } else {
      toast({
        title: 'Error al Actualizar Contacto',
        description: result.message || 'No se pudo actualizar el contacto.',
        variant: 'destructive',
      });
    }
  }
  
  // Ensure dialog content is not rendered if no initialData (unless open is also true and form is about to be populated)
  if (!open && !initialData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No DialogTrigger needed as it's controlled by `open` prop */}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5" /> Editar Contacto: {initialData?.name}
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del contacto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-3 pl-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan.perez@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'new'}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {contactStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value} className="capitalize">
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fuente (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Referido, Web" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cualquier detalle relevante sobre el contacto..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !userId || !initialData?.id}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
