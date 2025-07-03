'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { removeMemberAction, changeMemberRoleAction } from '@/actions/groupActions';

const initialState = { success: false, message: '' };

function RemoveMemberForm({ groupId, memberId }: { groupId: string; memberId: string }) {
  const [state, formAction] = useFormState(removeMemberAction, initialState);

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success(state.message) : toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="memberId" value={memberId} />
      <AlertDialogAction type="submit" className="w-full">
        Confirmar y Eliminar
      </AlertDialogAction>
    </form>
  );
}

function ChangeRoleForm({ groupId, memberId, newRole, children }: { groupId: string; memberId: string; newRole: 'admin' | 'member'; children: React.ReactNode }) {
  const [state, formAction] = useFormState(changeMemberRoleAction, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success(state.message) : toast.error(state.message);
    }
  }, [state]);
  
  return (
    <form action={formAction}>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="newRole" value={newRole} />
      <button type="submit" className="w-full text-left">
        {children}
      </button>
    </form>
  )
}

export default function MemberActions({ group, member, isCurrentUserAdmin, currentUserId }: { group: any; member: any; isCurrentUserAdmin: boolean, currentUserId: string }) {
  // Un admin no puede realizar acciones sobre sí mismo (excepto el dueño, que no se puede eliminar)
  // o sobre el dueño del grupo.
  if (!isCurrentUserAdmin || member.user.id === currentUserId || member.user.id === group.owner.id) {
    return null;
  }
  
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Cambiar Rol</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuLabel>Nuevo Rol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={member.role === 'admin'}>
                  <ChangeRoleForm groupId={group.id} memberId={member.user.id} newRole="admin">
                    <span>Admin</span>
                  </ChangeRoleForm>
                </DropdownMenuItem>
                <DropdownMenuItem disabled={member.role === 'member'}>
                  <ChangeRoleForm groupId={group.id} memberId={member.user.id} newRole="member">
                    <span>Miembro</span>
                  </ChangeRoleForm>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-600 focus:text-red-500">
              Eliminar Miembro
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Se eliminará a <span className="font-bold">{member.user.name}</span> del grupo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <RemoveMemberForm groupId={group.id} memberId={member.user.id} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 