'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteGroupAction } from '@/actions/groupActions';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from 'lucide-react';

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
}

export default function DeleteGroupButton({ groupId, groupName }: DeleteGroupButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${groupName}"? Esta acción es irreversible.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteGroupAction(groupId);
      if (result.success) {
        toast.success('Grupo eliminado con éxito');
        router.refresh();
      } else {
        toast.error(`Error al eliminar el grupo: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Error inesperado: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenuItem 
      className="text-destructive focus:text-destructive cursor-pointer"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Eliminando...' : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar grupo
        </>
      )}
    </DropdownMenuItem>
  );
} 