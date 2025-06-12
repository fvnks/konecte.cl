// src/components/crm/AddContactDialog.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// Updated import paths
import { addContactFormSchema, type AddContactFormValues } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addContactAction } from '@/actions/crmActions';
import { Loader2, UserPlus } from 'lucide-react';
import { contactStatusOptions, type Contact } from '@/lib/types'; // contactStatusOptions is still imported from @/lib/types
import type React from 'react';
import { useState } from 'react';

interface AddContactDialogProps {
  children: React.ReactNode; // For the trigger button
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactAdded: (contact: Contact) => void;
  userId: string | undefined;
}

export default function AddContactDialog({
  children,
  open,
  onOpenChange,
  onContactAdded,
  userId,
}: AddContactDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddContactFormValues>({
    resolver: zodResolver(addContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
      status: 'new',
      source: '',
      notes: '',
    },
  });

  async function onSubmit(values: AddContactFormValues) {
    if (!userId) {
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const result = await addContactAction(values, userId);
    setIsSubmitting(false);

    if (result.success && result.contact) {
      toast({
        title: 'Contacto Añadido',
        description: `El contacto "${result.contact.name}" ha sido añadido exitosamente.`,
      });
      onContactAdded(result.contact);
      form.reset();
      onOpenChange(false); // Close dialog on success
    } else {
      toast({
        title: 'Error al Añadir Contacto',
        description: result.message || 'No se pudo añadir el contacto. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Añadir Nuevo Contacto
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo contacto en tu CRM.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Button type="submit" disabled={isSubmitting || !userId}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Guardar Contacto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
