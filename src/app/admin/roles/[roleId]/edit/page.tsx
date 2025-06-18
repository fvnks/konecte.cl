// src/app/admin/roles/[roleId]/edit/page.tsx
import { getRoleByIdAction, getAvailablePermissionsAction } from '@/actions/roleActions';
import EditRolePermissionsForm from '@/components/admin/roles/EditRolePermissionsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';

interface AdminEditRolePageProps {
  params: {
    roleId: string;
  };
}

export default async function AdminEditRolePage({ params }: AdminEditRolePageProps) {
  const roleId = params.roleId;
  
  const [role, allPermissions] = await Promise.all([
    getRoleByIdAction(roleId),
    getAvailablePermissionsAction()
  ]);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Rol No Encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El rol con ID "{roleId}" no fue encontrado o no existe.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/roles">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión de Roles
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Button asChild variant="outline" size="sm">
          <Link href="/admin/roles" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Gestión de Roles
          </Link>
        </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center">
            <ShieldAlert className="h-7 w-7 mr-3 text-primary" />
            Editar Permisos del Rol: <span className="text-primary ml-1">{role.name}</span>
          </CardTitle>
          <CardDescription>
            ID del Rol: <code className="bg-muted px-1 rounded-sm text-xs">{role.id}</code>. Selecciona los permisos que deseas asignar a este rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditRolePermissionsForm 
            initialRole={role} 
            availablePermissions={allPermissions} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
