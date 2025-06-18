// src/components/admin/roles/EditRolePermissionsForm.tsx
'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { updateRolePermissionsAction } from '@/actions/roleActions';
import type { Role } from '@/lib/types';
import { type AppPermission, PERMISSION_GROUPS, PERMISSION_LABELS, type PermissionGroupName } from '@/lib/permissions';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const editRolePermissionsSchema = z.object({
  selectedPermissions: z.array(z.string()).default([]), // Array de strings de permisos
});

type EditRolePermissionsFormValues = z.infer<typeof editRolePermissionsSchema>;

interface EditRolePermissionsFormProps {
  initialRole: Role;
  availablePermissions: AppPermission[];
}

export default function EditRolePermissionsForm({ initialRole, availablePermissions }: EditRolePermissionsFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EditRolePermissionsFormValues>({
    resolver: zodResolver(editRolePermissionsSchema),
    defaultValues: {
      selectedPermissions: initialRole.permissions || [],
    },
  });

  useEffect(() => {
    form.reset({
      selectedPermissions: initialRole.permissions || [],
    });
  }, [initialRole, form]);

  async function onSubmit(values: EditRolePermissionsFormValues) {
    const result = await updateRolePermissionsAction(initialRole.id, values.selectedPermissions as AppPermission[]);
    if (result.success) {
      toast({
        title: 'Permisos Actualizados',
        description: `Los permisos para el rol "${initialRole.name}" han sido actualizados.`,
      });
      router.push('/admin/roles'); // Redirigir de vuelta a la lista de roles
    } else {
      toast({
        title: 'Error al Actualizar Permisos',
        description: result.message || 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    }
  }
  
  const permissionGroupsOrdered = Object.keys(PERMISSION_GROUPS) as PermissionGroupName[];

  // Crear un conjunto de permisos disponibles para búsqueda rápida
  const availablePermissionsSet = new Set(availablePermissions);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Accordion type="multiple" defaultValue={permissionGroupsOrdered} className="w-full space-y-3">
          {permissionGroupsOrdered.map((groupName) => {
            const permissionsInGroup = PERMISSION_GROUPS[groupName].filter(p => availablePermissionsSet.has(p));
            if (permissionsInGroup.length === 0) return null; // No renderizar grupo si no hay permisos disponibles en él

            return (
              <AccordionItem value={groupName} key={groupName} className="border rounded-lg bg-secondary/30 px-1">
                <AccordionTrigger className="py-3 px-4 text-md font-semibold hover:no-underline">
                  {groupName} ({permissionsInGroup.length})
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-3 px-4">
                  <div className="space-y-3">
                    {permissionsInGroup.map((permission) => (
                      <FormField
                        key={permission}
                        control={form.control}
                        name="selectedPermissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2.5 border-b border-border/50 last:border-b-0 hover:bg-background/50 rounded-sm transition-colors">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), permission])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== permission
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                              {PERMISSION_LABELS[permission] || permission}
                               <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded-sm opacity-70">{permission}</code>
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <FormMessage>{form.formState.errors.selectedPermissions?.message}</FormMessage>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Permisos
          </Button>
        </div>
      </form>
    </Form>
  );
}

