
// src/components/admin/users/AdminEditUserForm.tsx
'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { adminEditUserFormSchema, type AdminEditUserFormValues, type User, type Role, type Plan } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import { adminUpdateUserAction } from '@/actions/userActions';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

interface AdminEditUserFormProps {
  user: User;
  roles: Role[];
  plans: Plan[]; // Solo planes activos deberían pasarse aquí
}

export default function AdminEditUserForm({ user, roles, plans }: AdminEditUserFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AdminEditUserFormValues>({
    resolver: zodResolver(adminEditUserFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role_id: user?.role_id || '',
      plan_id: user?.plan_id || null,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        role_id: user.role_id || '',
        plan_id: user.plan_id || null,
      });
    }
  }, [user, form]);

  async function onSubmit(values: AdminEditUserFormValues) {
    if (!user?.id) {
      toast({ title: "Error", description: "ID de usuario no encontrado.", variant: "destructive" });
      return;
    }
    const result = await adminUpdateUserAction(user.id, values);
    if (result.success) {
      toast({
        title: 'Usuario Actualizado',
        description: `Los datos de ${result.user?.name || 'el usuario'} han sido actualizados.`,
      });
      router.push('/admin/users');
    } else {
      toast({
        title: 'Error al Actualizar',
        description: result.message || 'No se pudo actualizar el usuario.',
        variant: 'destructive',
      });
    }
  }

  if (!user) {
    return <p>Cargando datos del usuario...</p>; // O un spinner mejor
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del usuario" {...field} />
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
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="role_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rol del Usuario</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {roles.map((role) => (
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
                <FormLabel>Plan Asignado</FormLabel>
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
                    {plans.map((plan) => ( // Asumimos que solo se pasan planes activos
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} disabled={form.formState.isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}

