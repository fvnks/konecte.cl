'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateGroupDetailsAction } from '@/actions/groupActions';

export default function EditGroupDialog({ group, children }: { group: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      groupId: group.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };

    startTransition(async () => {
      const result = await updateGroupDetailsAction(payload);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
          <DialogDescription>
            Realiza cambios a los detalles de tu grupo. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="name" className="font-medium">Nombre del Grupo</label>
                <Input id="name" name="name" defaultValue={group.name} required />
            </div>
            <div className="space-y-2">
                <label htmlFor="description" className="font-medium">Descripción</label>
                <Textarea id="description" name="description" defaultValue={group.description || ''} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 