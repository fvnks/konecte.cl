// src/app/dashboard/crm/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, UserCircle, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import type { Contact, User as StoredUserType } from '@/lib/types';
import { getUserContactsAction, deleteContactAction } from '@/actions/crmActions';
import ContactListItem from '@/components/crm/ContactListItem';
import AddContactDialog from '@/components/crm/AddContactDialog';
import EditContactDialog from '@/components/crm/EditContactDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CrmPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [contactToDelete, setContactToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  
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
      setIsLoading(false); 
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
        setIsLoading(false);
      }
    }
    if (loggedInUser || isLoading) {
        fetchContacts();
    }
  }, [loggedInUser, toast, isLoading]);

  const handleContactAdded = (newContact: Contact) => {
    setContacts(prevContacts => [newContact, ...prevContacts].sort((a, b) => a.name.localeCompare(b.name)));
    setIsAddContactOpen(false);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts(prevContacts => 
      prevContacts.map(c => c.id === updatedContact.id ? updatedContact : c)
                  .sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsEditModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteRequest = (contactId: string, contactName: string) => {
    setContactToDelete({ id: contactId, name: contactName });
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete || !loggedInUser?.id) return;
    setIsDeleteAlertOpen(false);
    startTransition(async () => {
      const result = await deleteContactAction(contactToDelete.id, loggedInUser!.id);
      if (result.success) {
        toast({
          title: 'Contacto Eliminado',
          description: `El contacto "${contactToDelete.name}" ha sido eliminado.`,
        });
        setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      } else {
        toast({
          title: 'Error al Eliminar',
          description: result.message || 'No se pudo eliminar el contacto.',
          variant: 'destructive',
        });
      }
      setContactToDelete(null);
    });
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
            <Button onClick={() => setIsAddContactOpen(true)} disabled={!loggedInUser || isLoading || isPending}>
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
                <ContactListItem 
                  key={contact.id} 
                  contact={contact}
                  onEdit={handleEditContact}
                  onDeleteRequest={handleDeleteRequest} 
                />
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
                <Button onClick={() => setIsAddContactOpen(true)} variant="default" disabled={!loggedInUser || isLoading || isPending}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Primer Contacto
                </Button>
              </AddContactDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {editingContact && (
        <EditContactDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onContactUpdated={handleContactUpdated}
          userId={loggedInUser?.id}
          initialData={editingContact}
        />
      )}

      {contactToDelete && (
         <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    Confirmar Eliminación
                </AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar al contacto <span className="font-semibold">{contactToDelete.name}</span>? 
                    Esta acción no se puede deshacer.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isPending}>
                    Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Sí, Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
