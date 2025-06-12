
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
import { getUsersAction, updateUserRoleAction, updateUserPlanAction } from '@/actions/userActions';
import { getRolesAction } from '@/actions/roleActions';
import { getPlansAction } from '@/actions/planActions';
import { PlusCircle, Users, Loader2, ShieldAlert, CreditCard, Contact as ContactIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminCreateUserDialog from '@/components/admin/users/AdminCreateUserDialog'; // Importar el nuevo diálogo

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
  const [plans, setPlans] = useState<Plan[]>([]); // Todos los planes, filtrados para activos en el diálogo
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPending, startTransition] = useTransition();

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
  }, [toast]); // toast es una dependencia de fetchData

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    fetchData(); // Vuelve a cargar todos los datos para reflejar el nuevo usuario
  };


  if (isLoadingData && users.length === 0) {
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
            <Button disabled={isLoadingData || roles.length === 0}>
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
                    <TableHead className="min-w-[180px]">Usuario</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="min-w-[200px]">Asignar Rol</TableHead>
                    <TableHead>Plan Actual</TableHead>
                    <TableHead className="min-w-[200px]">Asignar Plan</TableHead>
                    <TableHead className="text-center min-w-[130px]">CRM del Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name.substring(0,1)}`} alt={user.name} data-ai-hint="persona" />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
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
                              disabled={isPending || isLoadingData}
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
                              <SelectTrigger className="w-full max-w-[180px] h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar plan" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="none" className="text-xs italic">Sin Plan</SelectItem>
                                  {activePlans.map(plan => ( // Usar activePlans para el select
                                  <SelectItem key={plan.id} value={plan.id} className="text-xs">{plan.name} (${plan.price_monthly.toLocaleString('es-CL')})</SelectItem>
                                  ))}
                              </SelectContent>
                              </Select>
                          ) : (
                              <span className="text-xs text-muted-foreground">Cargando...</span>
                          )}
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                          <Link href={`/admin/users/${user.id}/crm`}>
                            <ContactIcon className="h-3.5 w-3.5 mr-1.5" /> Ver CRM
                          </Link>
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
    </div>
  );
}
