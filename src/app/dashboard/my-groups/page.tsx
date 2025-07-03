import { getUserGroupsAction } from '@/actions/groupActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GroupsTable from './_components/GroupsTable';

export default async function MyGroupsPage() {
  const { success, groups, primaryGroupId, message } = await getUserGroupsAction();

  if (!success) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error al cargar los grupos</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Grupos</h1>
          <p className="text-muted-foreground mt-1">Administra tus grupos y membresías</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/my-groups/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Nuevo Grupo
          </Link>
        </Button>
      </div>

      {groups && groups.length > 0 ? (
        <GroupsTable groups={groups} primaryGroupId={primaryGroupId} />
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-10 pb-10 text-center flex flex-col items-center">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Aún no tienes grupos</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Crea tu primer grupo para organizar a tus corredores, formar una asociación gremial o colaborar en equipo.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/my-groups/new">Crear mi primer grupo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 