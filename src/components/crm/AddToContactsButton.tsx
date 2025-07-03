'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, X, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addAuthorToMyContactsAction } from '@/actions/crmActions';
import type { User as StoredUser } from '@/lib/types';

interface AddToContactsButtonProps {
  author: StoredUser;
  viewerId: string | undefined;
}

export default function AddToContactsButton({ author, viewerId }: AddToContactsButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClick = () => {
    if (!viewerId) {
      toast({
        variant: "destructive",
        title: "No has iniciado sesión",
        description: "Debes iniciar sesión para añadir contactos.",
      });
      return;
    }

    startTransition(async () => {
      const authorData = {
        id: author.id,
        name: author.name,
        email: author.email,
        phone: author.phone_number,
      };
      const response = await addAuthorToMyContactsAction(authorData, viewerId);
      setResult(response);
      toast({
        title: response.success ? 'Éxito' : 'Error',
        description: response.message,
        variant: response.success ? 'default' : 'destructive',
      });
    });
  };

  if (result?.success) {
    return (
      <Button disabled variant="outline" className="w-full sm:w-auto bg-green-100 dark:bg-green-900/50 border-green-400 text-green-700 dark:text-green-300">
        <Check className="mr-2 h-4 w-4" />
        Contacto Añadido
      </Button>
    );
  }
  
  return (
    <Button onClick={handleClick} disabled={isPending} className="w-full sm:w-auto">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      Añadir a mis Contactos
    </Button>
  );
} 