// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, UserRole } from "@/lib/types";
import { sampleUsers as initialSampleUsers } from "@/lib/types"; // Using placeholder data
import { PlusCircle, UserCog, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "user", label: "Usuario" },
  { value: "admin", label: "Administrador" },
];

const getRoleBadgeVariant = (role: UserRole) => {
  if (role === 'admin') return 'default';
  return 'secondary';
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  // Manejaremos el estado de los usuarios localmente para esta simulación
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Cargamos los usuarios de ejemplo al montar el componente
    // En una app real, aquí harías un fetch a tu API
    setUsers(initialSampleUsers);
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    // Simular guardado en backend
    console.log(`Simulación: Cambiado rol del usuario ${userId} a ${newRole}`);
    toast({
      title: "Rol Actualizado (Simulación)",
      description: `El rol del usuario ha sido cambiado a ${roleOptions.find(r => r.value === newRole)?.label}. Este cambio es solo visual.`,
    });
    // En una app real, aquí llamarías a una server action o API para persistir el cambio.
    // Por ejemplo: await updateUserRoleAction(userId, newRole);
  };

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
          <Button disabled> {/* Deshabilitado ya que no implementaremos la creación real */}
            <PlusCircle className="h-4 w-4 mr-2" /> Añadir Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
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
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="persona" />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                        {roleOptions.find(r => r.value === user.role)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end items-center">
                        <UserCog className="h-5 w-5 mr-2 text-muted-foreground" />
                        <Select
                          defaultValue={user.role}
                          onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay usuarios para mostrar.</p>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-xl">Sobre los Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Usuario (User):</strong> Puede navegar por el sitio, ver propiedades, publicar propiedades/solicitudes y comentar.</p>
            <p><strong>Administrador (Admin):</strong> Tiene todos los permisos de un usuario, además de acceso al Panel de Administración para gestionar configuraciones del sitio y usuarios.</p>
            <p className="mt-2 italic">Nota: La creación de usuarios y la persistencia real de los cambios de roles no están implementadas en esta simulación. Los cambios de rol son solo visuales.</p>
        </CardContent>
      </Card>
    </div>
  );
}
