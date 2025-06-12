
// src/components/admin/users/AdminCreateUserDialog.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { adminCreateUserFormSchema, type AdminCreateUserFormValues, type Role, type Plan } from '@/lib/types';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminCreateUserAction } from '@/actions/userActions';
import { Loader2, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

interface AdminCreateUserDialogProps {
  roles: Role[];
  plans: Plan[]; // Asumimos que solo se pasan planes activos
  onUserCreated: () => void; // Callback para refrescar la lista en la página padre
  children: React.ReactNode; // Para el botón de trigger
}

export default function AdminCreateUserDialog({
  roles,
  plans,
  onUserCreated,
  children
}: AdminCreateUserDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminCreateUserFormValues>({
    resolver: zodResolver(adminCreateUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role_id: roles.find(r => r.id === 'user')?.id || roles[0]?.id || '', // Default to 'user' or first available
      plan_id: null, // Default to no plan
    },
  });

  async function onSubmit(values: AdminCreateUserFormValues) {
    setIsSubmitting(true);
    const result = await adminCreateUserAction(values);
    setIsSubmitting(false);

    if (result.success && result.user) {
      toast({
        title: 'Usuario Creado',
        description: `El usuario "${result.user.name}" ha sido creado exitosamente.`,
      });
      onUserCreated(); // Notificar al padre para refrescar
      form.reset();
      setIsOpen(false);
    } else {
      toast({
        title: 'Error al Crear Usuario',
        description: result.message || 'No se pudo crear el usuario. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  // Reset form cuando el diálogo se cierra
  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role_id: roles.find(r => r.id === 'user')?.id || roles[0]?.id || '',
        plan_id: null,
      });
    }
  }, [isOpen, form, roles]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Crear Nuevo Usuario (Admin)
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo usuario en el sistema.
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
                    <Input placeholder="Ej: Ana García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ana.garcia@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id} className="capitalize">
                            {role.name}
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
                    name="plan_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Plan (Opcional)</FormLabel>
                        <Select 
                            onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                            value={field.value || 'none'}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none" className="italic">Sin Plan</SelectItem>
                                {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id} className="capitalize">
                                    {plan.name} (${plan.price_monthly.toLocaleString('es-CL')})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || roles.length === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
