'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { findUserByEmailAction } from '@/actions/userActions';
import { addMemberAction } from '@/actions/groupActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';

export default function AddMemberDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, startSearchTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();

  const handleSearch = () => {
    startSearchTransition(async () => {
      setFoundUser(null);
      const result = await findUserByEmailAction(email);
      if (result.success) {
        setFoundUser(result.user);
        setSearchMessage('');
      } else {
        setSearchMessage(result.message);
      }
    });
  };

  const handleAddMember = () => {
    if (!foundUser) return;
    
    startAddTransition(async () => {
        const formData = new FormData();
        formData.append('groupId', groupId);
        formData.append('userId', foundUser.id);
        const result = await addMemberAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setEmail('');
            setFoundUser(null);
        } else {
            toast.error(result.message);
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Añadir Miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Miembro</DialogTitle>
          <DialogDescription>
            Busca un usuario por su email para añadirlo al grupo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={!email || isSearching}>
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          {searchMessage && <p className="text-sm text-red-500">{searchMessage}</p>}
          {foundUser && (
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={foundUser.avatarUrl} alt={foundUser.name} />
                  <AvatarFallback>{foundUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{foundUser.name}</p>
                  <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                </div>
              </div>
              <Button onClick={handleAddMember} disabled={isAdding} size="sm">
                {isAdding ? 'Añadiendo...' : 'Añadir'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 