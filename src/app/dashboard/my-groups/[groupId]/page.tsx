import { getGroupByIdAction } from '@/actions/groupActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import EditGroupDialog from './_components/EditGroupDialog';
import { getSession } from '@/lib/session';
import MemberActions from './_components/MemberActions';
import AddMemberDialog from './_components/AddMemberDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, Users } from 'lucide-react';

export default async function GroupAdminPage({ params }: { params: { groupId: string } }) {
  const [session, groupData] = await Promise.all([
    getSession(),
    getGroupByIdAction(params.groupId),
  ]);

  const { success, group, message } = groupData;
  const currentUser = session;

  if (!success || !group) {
    // Si el grupo no se encuentra o el usuario no tiene permiso, muestra 404
    notFound();
  }

  const currentUserMembership = group.members.find(m => m.user.id === currentUser?.id);
  const isCurrentUserAdmin = currentUserMembership?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={group.avatarUrl} alt={group.name} />
            <AvatarFallback>
                <Building className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{group.name}</h1>
            <p className="text-sm text-muted-foreground">Administra la configuración y los miembros de tu grupo.</p>
          </div>
        </div>
        {isCurrentUserAdmin && (
          <div className="flex gap-2 self-start sm:self-center">
            <AddMemberDialog groupId={group.id} />
            <EditGroupDialog group={group}>
                <Button variant="outline">Editar</Button>
            </EditGroupDialog>
          </div>
        )}
      </div>

      {/* --- CUERPO PRINCIPAL (GRID) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Miembros */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Miembros ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                  {group.members.map((member) => (
                      <li key={member.user.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-4">
                              <Avatar>
                                  <AvatarImage src={member.user.avatarUrl} alt={member.user.name} />
                                  <AvatarFallback>{member.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium">{member.user.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-4">
                              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                  {member.role === 'admin' ? 'Admin' : 'Miembro'}
                              </Badge>
                              <MemberActions 
                                  group={group} 
                                  member={member} 
                                  isCurrentUserAdmin={isCurrentUserAdmin} 
                                  currentUserId={currentUser.id} 
                              />
                          </div>
                      </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Detalles del Grupo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sobre el grupo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Descripción</h3>
                <p className="text-muted-foreground text-sm">{group.description || 'No se ha proporcionado una descripción.'}</p>
              </div>
              <div className="border-t pt-4">
                 <h3 className="font-semibold text-sm mb-2">Propietario</h3>
                 <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={group.owner?.avatarUrl} alt={group.owner?.name}/>
                        <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{group.owner?.name}</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
} 