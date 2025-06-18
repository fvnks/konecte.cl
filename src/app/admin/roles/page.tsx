// src/app/admin/roles/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Role } from '@/lib/types';
import { addRoleAction, deleteRoleAction, getRolesAction } from '@/actions/roleActions';
import { Loader2, PlusCircle, ShieldAlert, Trash2, Edit } from 'lucide-react';
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
import Link from 'next/link'; // Import Link
import StyledEditButton from '@/components/ui/StyledEditButton'; // Import StyledEditButton

export default function AdminRolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await getRolesAction();
      setRoles(fetchedRoles);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los roles.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newRoleId.trim() || !newRoleName.trim()) {
      toast({ title: "Error", description: "El ID y el Nombre del rol son requeridos.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', newRoleId.trim());
      formData.append('name', newRoleName.trim());
      if (newRoleDescription.trim()) {
        formData.append('description', newRoleDescription.trim());
      }
      // Se pasa un array vacío como string JSON para los permisos iniciales
      formData.append('permissions', JSON.stringify([]));


      const result = await addRoleAction(formData);
      if (result.success) {
        toast({ title: "Rol Añadido", description: result.message });
        setNewRoleId('');
        setNewRoleName('');
        setNewRoleDescription('');
        await fetchRoles(); 
      } else {
        toast({ title: "Error al Añadir Rol", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    startTransition(async () => {
      const result = await deleteRoleAction(roleId);
      if (result.success) {
        toast({ title: "Rol Eliminado", description: result.message });
        await fetchRoles(); 
      } else {
        toast({ title: "Error al Eliminar Rol", description: result.message, variant: "destructive" });
      }
    });
  };
  
  if (isLoading && roles.length === 0) { 
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <ShieldAlert className="h-6 w-6 mr-2 text-primary" /> Gestión de Roles
          </CardTitle>
          <CardDescription>Crea, visualiza, edita permisos y elimina roles de usuario en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRole} className="space-y-4 mb-8 p-4 border rounded-lg bg-secondary/30">
            <h3 className="text-lg font-semibold">Añadir Nuevo Rol</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="newRoleId" className="block text-sm font-medium mb-1">ID del Rol</label>
                <Input 
                  id="newRoleId" 
                  value={newRoleId} 
                  onChange={(e) => setNewRoleId(e.target.value)} 
                  placeholder="Ej: editor_contenido" 
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">Identificador único. Solo letras, números y guion bajo.</p>
              </div>
              <div>
                <label htmlFor="newRoleName" className="block text-sm font-medium mb-1">Nombre del Rol</label>
                <Input 
                  id="newRoleName" 
                  value={newRoleName} 
                  onChange={(e) => setNewRoleName(e.target.value)} 
                  placeholder="Ej: Editor de Contenido" 
                  required 
                />
                 <p className="text-xs text-muted-foreground mt-1">Nombre legible para mostrar.</p>
              </div>
               <div>
                <label htmlFor="newRoleDescription" className="block text-sm font-medium mb-1">Descripción (Opcional)</label>
                <Textarea 
                  id="newRoleDescription" 
                  value={newRoleDescription} 
                  onChange={(e) => setNewRoleDescription(e.target.value)} 
                  placeholder="Breve descripción del rol" 
                  rows={1}
                  className="min-h-[40px]"
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending || !newRoleId.trim() || !newRoleName.trim()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Añadir Rol
            </Button>
          </form>

          <h3 className="text-lg font-semibold mb-2">Roles Existentes</h3>
          {isLoading && roles.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de roles...</p>}
          {roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos Asignados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono">{role.id}</TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{role.description || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {role.permissions && role.permissions.length > 0 
                            ? role.permissions.includes('*') 
                                ? 'Todos los permisos (Superadmin)' 
                                : `${role.permissions.length} permiso(s)`
                            : 'Ninguno'
                        }
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs">
                        <Link href={`/admin/roles/${role.id}/edit`}>
                            <Edit className="h-3.5 w-3.5 mr-1" /> Editar Permisos
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isPending || role.id === 'admin' || role.id === 'user' || role.id === 'broker'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Eliminarás permanentemente el rol "{role.name}".
                              Asegúrate de que ningún usuario esté asignado a este rol antes de eliminarlo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRole(role.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Sí, eliminar rol
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay roles definidos (excepto los iniciales si existen en la BD).</p>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-secondary/30">
        <CardHeader>
            <CardTitle className="text-xl">Notas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Los roles con ID <strong>admin</strong>, <strong>user</strong> y <strong>broker</strong> son considerados roles base del sistema. Si existen, no podrán ser eliminados desde esta interfaz para prevenir problemas.</p>
            <p>Antes de eliminar un rol, asegúrate de reasignar los usuarios que lo tengan a otro rol válido.</p>
            <p>Los ID de los roles deben ser únicos y solo pueden contener letras, números y guiones bajos (ej: `editor_principal`).</p>
            <p>Los permisos se asignan como un conjunto de identificadores (ej: "property:create"). El permiso "*" otorga acceso total.</p>
        </CardContent>
      </Card>
    </div>
  );
}

