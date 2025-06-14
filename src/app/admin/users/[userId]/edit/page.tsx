
// src/app/admin/users/[userId]/edit/page.tsx
import { getUserByIdAction, getUsersAction } from '@/actions/userActions'; // getUsersAction no es necesaria aquí
import { getRolesAction } from '@/actions/roleActions';
import { getPlansAction } from '@/actions/planActions';
import AdminEditUserForm from '@/components/admin/users/AdminEditUserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, UserCog } from 'lucide-react';
import Link from 'next/link';
import type { User, Role, Plan } from '@/lib/types';

interface AdminEditUserPageProps {
  params: {
    userId: string;
  };
}

export default async function AdminEditUserPage({ params }: AdminEditUserPageProps) {
  const userId = params.userId;

  const user = await getUserByIdAction(userId);
  const roles = await getRolesAction();
  const allPlans = await getPlansAction();
  const activePlans = allPlans.filter(plan => plan.is_active);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Usuario No Encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El usuario con ID "{userId}" no fue encontrado o no existe.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión de Usuarios
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/users" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Gestión de Usuarios
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center">
            <UserCog className="h-7 w-7 mr-3 text-primary" />
            Editar Usuario: <span className="text-primary ml-1">{user.name}</span>
          </CardTitle>
          <CardDescription>
            Modifica los detalles del usuario. La contraseña no se puede cambiar desde este formulario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEditUserForm user={user} roles={roles} plans={activePlans} />
        </CardContent>
      </Card>
    </div>
  );
}

