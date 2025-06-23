
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminCreateUserAction } from '@/actions/userActions';
import { Loader2, UserPlus, Briefcase } from 'lucide-react';
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface AdminCreateUserDialogProps {
  roles: Role[];
  plans: Plan[]; 
  onUserCreated: () => void; 
  children: React.ReactNode; 
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
      phone_number: '',
      rut_tin: '',
      password: '',
      confirmPassword: '',
      role_id: roles.find(r => r.id === 'user')?.id || roles[0]?.id || '',
      plan_id: null,
      company_name: '',
      main_operating_region: '',
      main_operating_commune: '',
      properties_in_portfolio_count: undefined,
      website_social_media_link: '',
    },
  });

  const watchedRoleId = form.watch('role_id');

  async function onSubmit(values: AdminCreateUserFormValues) {
    setIsSubmitting(true);
    const result = await adminCreateUserAction(values);
    setIsSubmitting(false);

    if (result.success && result.user) {
      toast({
        title: 'Usuario Creado',
        description: `El usuario "${result.user.name}" ha sido creado exitosamente.`,
      });
      onUserCreated(); 
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

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: '',
        email: '',
        phone_number: '',
        rut_tin: '',
        password: '',
        confirmPassword: '',
        role_id: roles.find(r => r.id === 'user')?.id || roles[0]?.id || '',
        plan_id: null,
        company_name: '',
        main_operating_region: '',
        main_operating_commune: '',
        properties_in_portfolio_count: undefined,
        website_social_media_link: '',
      });
    }
  }, [isOpen, form, roles]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" /> Crear Nuevo Usuario (Admin)
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo usuario en el sistema. Los campos con * son requeridos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-3 pl-1">
            <h4 className="text-sm font-medium text-muted-foreground">Información Principal</h4>
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo *</FormLabel> <FormControl> <Input placeholder="Ej: Ana García" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Correo Electrónico *</FormLabel> <FormControl> <Input type="email" placeholder="ana.garcia@ejemplo.com" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="phone_number" render={({ field }) => ( <FormItem> <FormLabel>Teléfono *</FormLabel> <FormControl> <Input placeholder="+56 9 1234 5678" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="rut_tin" render={({ field }) => ( <FormItem> <FormLabel>RUT *</FormLabel> <FormControl> <Input placeholder="12.345.678-9" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Contraseña *</FormLabel> <FormControl> <Input type="password" placeholder="••••••••" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirmar Contraseña *</FormLabel> <FormControl> <Input type="password" placeholder="••••••••" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="role_id" render={({ field }) => ( <FormItem> <FormLabel>Rol *</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Selecciona un rol" /> </SelectTrigger> </FormControl> <SelectContent> {roles.map(role => ( <SelectItem key={role.id} value={role.id} className="capitalize">{role.name}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="plan_id" render={({ field }) => ( <FormItem> <FormLabel>Plan (Opcional)</FormLabel> <Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value || 'none'}> <FormControl> <SelectTrigger> <SelectValue placeholder="Selecciona un plan" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="none" className="italic">Sin Plan</SelectItem> {plans.map(plan => ( <SelectItem key={plan.id} value={plan.id} className="capitalize">{plan.name} (${plan.price_monthly.toLocaleString('es-CL')})</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            </div>

            {watchedRoleId === 'broker' && (
              <>
                <Separator className="my-6" />
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4"/>Información de Corredor (Opcional)</h4>
                <FormField control={form.control} name="company_name" render={({ field }) => ( <FormItem> <FormLabel>Nombre de la Empresa</FormLabel> <FormControl><Input placeholder="Inmobiliaria Konecte" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="main_operating_region" render={({ field }) => ( <FormItem> <FormLabel>Región Principal</FormLabel> <FormControl><Input placeholder="Valparaíso" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="main_operating_commune" render={({ field }) => ( <FormItem> <FormLabel>Comuna Principal</FormLabel> <FormControl><Input placeholder="Viña del Mar" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                </div>
                <FormField control={form.control} name="properties_in_portfolio_count" render={({ field }) => ( <FormItem> <FormLabel>Propiedades en Cartera</FormLabel> <FormControl><Input type="number" min="0" placeholder="25" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="website_social_media_link" render={({ field }) => ( <FormItem> <FormLabel>Sitio Web o Red Social</FormLabel> <FormControl><Input type="url" placeholder="https://tuweb.cl" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </>
            )}
            
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
