
// src/components/property/RequestVisitButtonClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, UserCircle, LogIn } from 'lucide-react';
import RequestVisitDialog from './RequestVisitDialog';
import type { User as StoredUserType } from '@/lib/types';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RequestVisitButtonClientProps {
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
}

export default function RequestVisitButtonClient({
  propertyId,
  propertyOwnerId,
  propertyTitle,
}: RequestVisitButtonClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const isOwner = loggedInUser?.id === propertyOwnerId;

  if (isLoadingAuth) {
    return (
      <Button className="w-full sm:w-auto" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
      </Button>
    );
  }

  if (!loggedInUser) {
    return (
      <Button className="w-full sm:w-auto" asChild>
        <Link href={`/auth/signin?redirect=/properties/${propertyId}`}> 
          <LogIn className="mr-2 h-4 w-4" /> Inicia sesión para solicitar visita
        </Link>
      </Button>
    );
  }

  if (isOwner) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}> {/* Necesario para que el tooltip funcione en un botón deshabilitado */}
              <Button className="w-full sm:w-auto" disabled>
                <CalendarPlus className="mr-2 h-4 w-4" /> Solicitar Visita
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>No puedes solicitar una visita a tu propia propiedad.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        <CalendarPlus className="mr-2 h-4 w-4" /> Solicitar Visita
      </Button>
      <RequestVisitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        propertyId={propertyId}
        propertyOwnerId={propertyOwnerId}
        propertyTitle={propertyTitle}
        visitorUser={loggedInUser}
      />
    </>
  );
}

