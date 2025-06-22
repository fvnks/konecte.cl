
// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Role, Plan } from "@/lib/types";
import { getUsersAction, updateUserRoleAction, updateUserPlanAction, adminDeleteUserAction, adminVerifyUserPhoneAction } from '@/actions/userActions';
import { getRolesAction } from '@/actions/roleActions';
import { getPlansAction } from '@/actions/planActions';
import { PlusCircle, Users, Loader2, ShieldAlert, CreditCard, Contact as ContactIcon, Trash2, Edit, Smartphone, ShieldCheck as ShieldCheckIcon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminCreateUserDialog from '@/components/admin/users/AdminCreateUserDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LoggedInAdmin {
  id: string;
}

const getRoleBadgeVariant = (roleId: string) => {
  if (roleId === 'admin') return 'default';
  return 'secondary';
};

const getPlanBadgeVariant = (planId?: string | null) => {
  if (!planId) return 'outline';
  return 'default';
};


export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToVerify, setUserToVerify] = useState<User | null>(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState<LoggedInAdmin | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    if (isClient) { // Ensure this runs only on the client
      const adminUserJson = localStorage.getItem('loggedInUser');
      if (adminUserJson) {
          try {
              const parsedAdmin: User = JSON.parse(adminUserJson);
              if (parsedAdmin.role_id === 'admin') {
                  setLoggedInAdmin({ id: parsedAdmin.id });
              } else {
                   toast({ title: "Acceso Denegado", description: "No tienes permisos de administrador.", variant: "destructive" });
              }
          } catch (e) {
              console.error("Error parsing admin user from storage", e);
              toast({ title: "Error de Sesión", description: "No se pudo verificar tu sesión. Intenta iniciar sesión de nuevo.", variant: "destructive" });
              localStorage.removeItem('loggedInUser'); // Clear corrupted data
          }
      } else {
          toast({ title: "Acceso Denegado", description: "Debes iniciar sesión como administrador.", variant: "destructive" });
      }
    }
  }, [isClient, toast]); // Added isClient to dependency array

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [fetchedUsers, fetchedRoles, fetchedPlans] = await Promise.all([
        getUsersAction(),
        getRolesAction(),
        getPlansAction()
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
      setPlans(fetchedPlans);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de usuarios, roles o planes.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) { // Also guard fetchData with isClient if it could run too early
        fetchData();
    }
  }, [fetchData, isClient]); // Added isClient to dependency array

  const handleRoleChange = (userId: string, newRoleId: string) => {
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRoleId);
      if (result.success) {
        toast({ title: "Rol Actualizado", description: result.message });
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role_id: newRoleId, role_name: roles.find(r => r.id === newRoleId)?.name } : user
          )
        );
      } else {
        toast({ title: "Error al Actualizar Rol", description: result.message, variant: "destructive" });
      }
    });
  };

  const handlePlanChange = (userId: string, newPlanId: string) => {
    startTransition(async () => {
      const planIdToSet = newPlanId === 'none' ? null : newPlanId;
      const result = await updateUserPlanAction(userId, planIdToSet);
      if (result.success) {
        toast({ title: "Plan Actualizado", description: result.message });
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, plan_id: planIdToSet, plan_name: plans.find(p => p.id === planIdToSet)?.name } : user
          )
        );
      } else {
        toast({ title: "Error al Actualizar Plan", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleUserCreated = () => {
    fetchData();
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete || !loggedInAdmin) return;
    if (userToDelete.id === loggedInAdmin.id) {
        toast({ title: "Acción no permitida", description: "No puedes eliminar tu propia cuenta de administrador.", variant: "destructive" });
        setUserToDelete(null);
        return;
    }

    startTransition(async () => {
      const result = await adminDeleteUserAction(userToDelete.id, loggedInAdmin.id);
      if (result.success) {
        toast({ title: "Usuario Eliminado", description: result.message });
        fetchData(); // Recargar la lista de usuarios
      } else {
        toast({ title: "Error al Eliminar Usuario", description: result.message, variant: "destructive" });
      }
      setUserToDelete(null); // Cerrar el diálogo
    });
  };

  const handleManualVerify = (user: User) => {
    setUserToVerify(user);
  };

  const confirmManualVerify = () => {
    if (!userToVerify) return;
    startTransition(async () => {
      const result = await adminVerifyUserPhoneAction(userToVerify.id);
      if (result.success) {
        toast({ title: "Verificación Exitosa", description: result.message });
        fetchData(); // Refetch data to update the UI
      } else {
        toast({ title: "Error de Verificación", description: result.message, variant: "destructive" });
      }
      setUserToVerify(null); // Close the dialog
    });
  };

  if (isLoadingData && users.length === 0 && isClient) { // Show loader only if client and initial load
     return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando datos...</p>
      </div>
    );
  }

  const activePlans = plans.filter(plan => plan.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" /> Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra los usuarios, sus roles y planes en la plataforma.</CardDescription>
          </div>
          <AdminCreateUserDialog roles={roles} plans={activePlans} onUserCreated={handleUserCreated}>
            <Button disabled={isLoadingData || roles.length === 0 || !loggedInAdmin}>
              <PlusCircle className="h-4 w-4 mr-2" /> Añadir Nuevo Usuario
            </Button>
          </AdminCreateUserDialog>
        </CardHeader>
        <CardContent>
          {isLoadingData && users.length > 0 && <p className="text-sm text-muted-foreground mb-2">Actualizando lista de usuarios...</p>}
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Asignar Rol</TableHead>
                    <TableHead>Plan Actual</TableHead>
                    <TableHead>Asignar Plan</TableHead>
                    <TableHead>Verificación Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name.substring(0,1)}`} alt={user.name} data-ai-hint="persona"/>
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate" title={user.name}>{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={user.email}>
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role_id)} className="capitalize text-xs">
                          {user.role_name || user.role_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center">
                          <ShieldAlert className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                          {roles.length > 0 ? (
                              <Select
                              value={user.role_id}
                              onValueChange={(newRole: string) => handleRoleChange(user.id, newRole)}
                              disabled={isPending || isLoadingData || user.id === loggedInAdmin?.id}
                              >
                              <SelectTrigger className="w-full max-w-[180px] h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent>
                                  {roles.map(role => (
                                  <SelectItem key={role.id} value={role.id} className="text-xs">{role.name}</SelectItem>
                                  ))}
                              </SelectContent>
                              </Select>
                          ) : (
                              <span className="text-xs text-muted-foreground">Cargando...</span>
                          )}
                         </div>
                      </TableCell>
                       <TableCell>
                        <Badge variant={getPlanBadgeVariant(user.plan_id)} className="capitalize text-xs">
                          {user.plan_name || (user.plan_id ? user.plan_id : 'Sin Plan')}
                        </Badge>
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                          {plans.length > 0 || !isLoadingData ? (
                              <Select
                              value={user.plan_id || 'none'}
                              onValueChange={(newPlan: string) => handlePlanChange(user.id, newPlan)}
                              disabled={isPending || isLoadingData}
                              >
                              <SelectTrigger className="w-full max-w-[200px] h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar plan" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="none" className="text-xs italic">Sin Plan</SelectItem>
                                  {activePlans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id} className="text-xs">{plan.name} (${plan.price_monthly.toLocaleString('es-CL')})</SelectItem>
                                  ))}
                              </SelectContent>
                              </Select>
                          ) : (
                              <span className="text-xs text-muted-foreground">Cargando...</span>
                          )}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.phone_verified ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                                <Smartphone className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleManualVerify(user)}
                                disabled={isPending}
                                title="Verificar teléfono manualmente"
                              >
                                Verificar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button variant="outline" size="icon" asChild className="h-8 w-8" title="Editar Usuario">
                            <Link href={`/admin/users/${user.id}/edit`}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild className="h-8 w-8" title="Ver CRM del Usuario">
                          <Link href={`/admin/users/${user.id}/crm`}>
                            <ContactIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          title="Eliminar Usuario"
                          disabled={isPending || isLoadingData || user.id === loggedInAdmin?.id || !loggedInAdmin}
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isLoadingData && <p className="text-muted-foreground text-center py-4">No hay usuarios para mostrar.</p>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación de Usuario</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar al usuario <span className="font-semibold">{userToDelete.name} ({userToDelete.email})</span>?
                <br />
                <strong className="text-destructive">¡Advertencia!</strong> Esta acción es irreversible y eliminará permanentemente al usuario junto con todas sus propiedades, solicitudes, comentarios y datos del CRM.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sí, Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {userToVerify && (
        <AlertDialog open={!!userToVerify} onOpenChange={(open) => !open && setUserToVerify(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  Confirmar Verificación Manual
              </AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres verificar manualmente el número de teléfono para el usuario <span className="font-semibold">{userToVerify.name}</span>? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToVerify(null)} disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmManualVerify} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sí, Verificar Manualmente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
