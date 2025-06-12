// src/app/dashboard/crm/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, UserCircle, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import type { Contact, User as StoredUserType } from '@/lib/types';
import { getUserContactsAction } from '@/actions/crmActions';
import ContactListItem from '@/components/crm/ContactListItem';
import AddContactDialog from '@/components/crm/AddContactDialog';
import { useToast } from '@/hooks/use-toast';

export default function CrmPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    } else {
      setIsLoading(false); // No user, stop loading if not already stopped
    }
  }, []);

  useEffect(() => {
    async function fetchContacts() {
      if (loggedInUser?.id) {
        setIsLoading(true);
        try {
          const fetchedContacts = await getUserContactsAction(loggedInUser.id);
          setContacts(fetchedContacts.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
          console.error("Error fetching contacts:", error);
          toast({
            title: 'Error al Cargar Contactos',
            description: 'No se pudieron obtener tus contactos. Intenta de nuevo más tarde.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      } else if (!localStorage.getItem('loggedInUser')) {
        // If there's definitively no user (checked both state and localStorage)
        setIsLoading(false);
      }
    }
    // Only fetch contacts if loggedInUser is set, or if it's the initial load (where loggedInUser might still be null but about to be set)
    if (loggedInUser || isLoading) { // isLoading check ensures initial fetch attempt if user is being loaded
        fetchContacts();
    }
  }, [loggedInUser, toast, isLoading]); // Added isLoading to dependencies to re-trigger if it changes

  const handleContactAdded = (newContact: Contact) => {
    setContacts(prevContacts => [newContact, ...prevContacts].sort((a, b) => a.name.localeCompare(b.name)));
    setIsAddContactOpen(false);
  };

  if (!loggedInUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold mb-2">Debes iniciar sesión para acceder a tu CRM.</p>
        <Button asChild>
          <Link href="/auth/signin">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center">
              <UsersIcon className="h-6 w-6 mr-2 text-primary" />
              Mis Contactos del CRM
            </CardTitle>
            <CardDescription>Gestiona tus clientes potenciales y contactos.</CardDescription>
          </div>
          <AddContactDialog
            open={isAddContactOpen}
            onOpenChange={setIsAddContactOpen}
            onContactAdded={handleContactAdded}
            userId={loggedInUser?.id}
          >
            <Button onClick={() => setIsAddContactOpen(true)} disabled={!loggedInUser || isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Contacto
            </Button>
          </AddContactDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando tus contactos...</p>
            </div>
          ) : contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map(contact => (
                <ContactListItem key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Aún no tienes contactos.</p>
              <p className="text-sm text-muted-foreground mb-4">Empieza añadiendo tu primer contacto para organizar tu red.</p>
              <AddContactDialog
                open={isAddContactOpen}
                onOpenChange={setIsAddContactOpen}
                onContactAdded={handleContactAdded}
                userId={loggedInUser?.id}
              >
                <Button onClick={() => setIsAddContactOpen(true)} variant="default" disabled={!loggedInUser || isLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Primer Contacto
                </Button>
              </AddContactDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
