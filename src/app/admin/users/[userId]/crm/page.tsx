
// src/app/admin/users/[userId]/crm/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users as UsersIcon, ArrowLeft, AlertTriangle, Contact as ContactIconLucide } from 'lucide-react';
import type { Contact, User as StoredUserType } from '@/lib/types';
import { getUserContactsAction } from '@/actions/crmActions';
import ContactListItem from '@/components/crm/ContactListItem';
import { useToast } from '@/hooks/use-toast';
import { getUsersAction } from '@/actions/userActions'; // Para obtener el nombre del usuario

interface AdminUserCrmPageProps {
  params: {
    userId: string;
  };
}

export default function AdminUserCrmPage({ params }: AdminUserCrmPageProps) {
  const { userId } = params;
  const [user, setUser] = useState<StoredUserType | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Obtener información del usuario (para mostrar su nombre)
        const allUsers = await getUsersAction();
        const currentUser = allUsers.find(u => u.id === userId);
        if (currentUser) {
          setUser(currentUser);
        } else {
          toast({
            title: 'Error',
            description: 'Usuario no encontrado.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Obtener contactos del CRM del usuario
        const fetchedContacts = await getUserContactsAction(userId);
        setContacts(fetchedContacts);

      } catch (error) {
        console.error("Error fetching user CRM data for admin:", error);
        toast({
          title: 'Error al Cargar Datos',
          description: 'No se pudieron obtener los datos del CRM del usuario.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) {
      fetchData();
    }
  }, [userId, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando CRM del usuario...</p>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl font-semibold mb-2">Usuario no encontrado</p>
        <p className="text-muted-foreground mb-4">No se pudo cargar la información para el ID de usuario proporcionado.</p>
        <Button asChild variant="outline">
          <Link href="/admin/users" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Gestión de Usuarios
          </Link>
        </Button>
      </div>
    );
  }
  
  const userName = user?.name || `Usuario (ID: ${userId.substring(0,8)}...)`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Gestión de Usuarios
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <ContactIconLucide className="h-6 w-6 mr-2 text-primary" />
            CRM de {userName}
          </CardTitle>
          <CardDescription>
            Visualizando los contactos del CRM para el usuario: {user?.email || 'N/A'}. (Vista de solo lectura para administradores).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map(contact => (
                <ContactListItem key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Este usuario aún no tiene contactos en su CRM.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
