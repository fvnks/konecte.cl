// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Role } from "@/lib/types";
import { getUsersAction, updateUserRoleAction } from '@/actions/userActions';
import { getRolesAction } from '@/actions/roleActions';
import { PlusCircle, UserCog, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getRoleBadgeVariant = (roleId: string) => {
  if (roleId === 'admin') return 'default'; // Primary color for admin
  // Puedes añadir más variantes si quieres colores específicos para otros roles
  return 'secondary';
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    setIsLoadingUsers(true);
    setIsLoadingRoles(true);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        getUsersAction(),
        getRolesAction()
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de usuarios o roles.", variant: "destructive" });
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = (userId: string, newRoleId: string) => {
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRoleId);
      if (result.success) {
        toast({
          title: "Rol Actualizado",
          description: result.message,
        });
        // Actualizar el rol localmente para reflejar el cambio inmediatamente
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name } : user
          )
        );
      } else {
        toast({
          title: "Error al Actualizar Rol",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const isLoading = isLoadingUsers || isLoadingRoles;

  if (isLoading && users.length === 0) {
     return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" /> Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra los usuarios y sus roles en la plataforma.</CardDescription>
          </div>
          <Button disabled> {/* Deshabilitado ya que no implementaremos la creación real de usuarios por ahora */}
            <PlusCircle className="h-4 w-4 mr-2" /> Añadir Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && users.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de usuarios...</p>}
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead className="text-right">Cambiar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name.substring(0,1)}`} alt={user.name} data-ai-hint="persona" />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role_id)} className="capitalize">
                        {user.role_name || user.role_id} 
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end items-center">
                        <UserCog className="h-5 w-5 mr-2 text-muted-foreground" />
                        {roles.length > 0 ? (
                            <Select
                            defaultValue={user.role_id}
                            onValueChange={(newRole: string) => handleRoleChange(user.id, newRole)}
                            disabled={isPending || isLoadingRoles}
                            >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-xs text-muted-foreground">Cargando roles...</span>
                        )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !isLoading && <p className="text-muted-foreground text-center py-4">No hay usuarios para mostrar.</p>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-xl">Sobre los Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            {roles.length > 0 ? roles.map(role => (
                <p key={role.id}><strong>{role.name}:</strong> {role.description || 'Rol de usuario.'}</p>
            )) : <p>Cargando descripciones de roles...</p>}
            <p className="mt-2 italic">Nota: La creación de usuarios no está implementada. Los cambios de rol se guardarán en la base de datos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
