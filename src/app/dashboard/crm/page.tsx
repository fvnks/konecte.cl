
// src/app/dashboard/crm/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, UserCircle, Users as UsersIcon, AlertTriangle, History as HistoryIcon, Search, Filter as FilterIcon, ListFilter } from 'lucide-react';
import type { Contact, User as StoredUserType, Interaction, ContactStatus } from '@/lib/types';
import { contactStatusOptions } from '@/lib/types';
import { getUserContactsAction, deleteContactAction, getContactInteractionsAction } from '@/actions/crmActions';
import ContactListItem from '@/components/crm/ContactListItem';
import AddContactDialog from '@/components/crm/AddContactDialog';
import EditContactDialog from '@/components/crm/EditContactDialog';
import ContactInteractionsDialog from '@/components/crm/ContactInteractionsDialog';
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

type SortOption = 'name-asc' | 'name-desc' | 'last_contacted_at-desc' | 'last_contacted_at-asc' | 'created_at-desc' | 'created_at-asc';

export default function CrmPage() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [contactToDelete, setContactToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [viewingInteractionsForContact, setViewingInteractionsForContact] = useState<Contact | null>(null);
  const [contactInteractions, setContactInteractions] = useState<Interaction[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [isInteractionsModalOpen, setIsInteractionsModalOpen] = useState(false);

  // States for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [displayedContacts, setDisplayedContacts] = useState<Contact[]>([]);

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
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    async function fetchContacts() {
      if (loggedInUser?.id) {
        setIsLoadingContacts(true);
        try {
          const fetchedContacts = await getUserContactsAction(loggedInUser.id);
          setContacts(fetchedContacts); 
        } catch (error) {
          console.error("Error fetching contacts:", error);
          toast({
            title: 'Error al Cargar Contactos',
            description: 'No se pudieron obtener tus contactos. Intenta de nuevo más tarde.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingContacts(false);
        }
      } else if (!localStorage.getItem('loggedInUser')) {
         setIsLoadingContacts(false);
      }
    }
    
    if (loggedInUser && contacts.length === 0 && !isLoadingContacts) {
        fetchContacts();
    } else if (!loggedInUser && !isLoadingContacts) {
        setContacts([]); 
    }
  }, [loggedInUser, toast]);

  useEffect(() => {
    let tempContacts = [...contacts];

    if (searchTerm) {
      tempContacts = tempContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.company_name && contact.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      tempContacts = tempContacts.filter(contact => contact.status === filterStatus);
    }

    tempContacts.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'last_contacted_at-desc': {
          const dateA = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
          const dateB = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
          return dateB - dateA;
        }
        case 'last_contacted_at-asc': {
          const dateA = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : Infinity;
          const dateB = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : Infinity;
          return dateA - dateB;
        }
        case 'created_at-desc': {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
        }
        case 'created_at-asc': {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateA - dateB;
        }
        default:
          return 0;
      }
    });

    setDisplayedContacts(tempContacts);
  }, [contacts, searchTerm, filterStatus, sortOption]);

  const handleContactAdded = (newContact: Contact) => {
    setContacts(prevContacts => [newContact, ...prevContacts]);
    setIsAddContactOpen(false);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts(prevContacts =>
      prevContacts.map(c => c.id === updatedContact.id ? updatedContact : c)
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

  const handleViewInteractions = async (contact: Contact) => {
    if (!loggedInUser?.id) return;
    setViewingInteractionsForContact(contact);
    setIsInteractionsModalOpen(true);
    setIsLoadingInteractions(true);
    try {
      const fetchedInteractions = await getContactInteractionsAction(contact.id, loggedInUser.id);
      setContactInteractions(fetchedInteractions);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las interacciones.', variant: 'destructive' });
      setContactInteractions([]);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const handleInteractionAdded = (newInteraction: Interaction) => {
    setContactInteractions(prev => [newInteraction, ...prev].sort((a,b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime() ));
    if (viewingInteractionsForContact) {
      setContacts(prevContacts => prevContacts.map(c =>
        c.id === viewingInteractionsForContact.id
        ? { ...c, last_contacted_at: newInteraction.interaction_date }
        : c
      ));
    }
  };

  const handleInteractionDeleted = (deletedInteractionId: string) => {
    setContactInteractions(prev => prev.filter(interaction => interaction.id !== deletedInteractionId));
    if (viewingInteractionsForContact && loggedInUser?.id) {
        getUserContactsAction(loggedInUser.id).then(fetchedContacts => {
            setContacts(fetchedContacts);
        });
    }
  };

  const handleInteractionUpdated = (updatedInteraction: Interaction) => {
    setContactInteractions(prevInteractions =>
      prevInteractions.map(i => (i.id === updatedInteraction.id ? updatedInteraction : i))
        .sort((a,b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())
    );
     if (viewingInteractionsForContact && loggedInUser?.id) {
        // Re-fetch contacts to update last_contacted_at if necessary
        getUserContactsAction(loggedInUser.id).then(fetchedContacts => {
            setContacts(fetchedContacts);
        });
    }
  };


  if (!loggedInUser && !isLoadingContacts) {
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name-asc', label: 'Nombre (A-Z)' },
    { value: 'name-desc', label: 'Nombre (Z-A)' },
    { value: 'last_contacted_at-desc', label: 'Último Contacto (Más Reciente)' },
    { value: 'last_contacted_at-asc', label: 'Último Contacto (Más Antiguo)' },
    { value: 'created_at-desc', label: 'Fecha Creación (Más Reciente)' },
    { value: 'created_at-asc', label: 'Fecha Creación (Más Antiguo)' },
  ];


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
            <Button onClick={() => setIsAddContactOpen(true)} disabled={!loggedInUser || isLoadingContacts || isPending}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Contacto
            </Button>
          </AddContactDialog>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label htmlFor="search-contacts" className="block text-sm font-medium text-muted-foreground mb-1">Buscar Contacto</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-contacts"
                    type="search"
                    placeholder="Nombre, email, empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-muted-foreground mb-1">Filtrar por Estado</label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ContactStatus | 'all')}>
                  <SelectTrigger id="filter-status">
                    <FilterIcon className="h-4 w-4 mr-2 opacity-50" />
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    {contactStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="capitalize">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                 <label htmlFor="sort-contacts" className="block text-sm font-medium text-muted-foreground mb-1">Ordenar Por</label>
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                  <SelectTrigger id="sort-contacts">
                    <ListFilter className="h-4 w-4 mr-2 opacity-50" />
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoadingContacts ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando tus contactos...</p>
            </div>
          ) : displayedContacts.length > 0 ? (
            <div className="space-y-4">
              {displayedContacts.map(contact => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEditContact}
                  onDeleteRequest={handleDeleteRequest}
                  onViewInteractions={handleViewInteractions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                {contacts.length > 0 ? "No hay contactos que coincidan con tus filtros." : "Aún no tienes contactos."}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {contacts.length > 0 ? "Intenta ajustar tu búsqueda o filtros." : "Empieza añadiendo tu primer contacto para organizar tu red."}
              </p>
              {contacts.length === 0 && (
                <AddContactDialog
                    open={isAddContactOpen}
                    onOpenChange={setIsAddContactOpen}
                    onContactAdded={handleContactAdded}
                    userId={loggedInUser?.id}
                >
                    <Button onClick={() => setIsAddContactOpen(true)} variant="default" disabled={!loggedInUser || isLoadingContacts || isPending}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Primer Contacto
                    </Button>
                </AddContactDialog>
              )}
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
                    Esta acción no se puede deshacer y eliminará también todas sus interacciones.
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

      {viewingInteractionsForContact && (
        <ContactInteractionsDialog
            open={isInteractionsModalOpen}
            onOpenChange={(open) => {
                setIsInteractionsModalOpen(open);
                if (!open) setViewingInteractionsForContact(null);
            }}
            contact={viewingInteractionsForContact}
            interactions={contactInteractions}
            onInteractionAdded={handleInteractionAdded}
            onInteractionDeleted={handleInteractionDeleted}
            onInteractionUpdated={handleInteractionUpdated} // Pass the new handler
            isLoadingInteractions={isLoadingInteractions}
            userId={loggedInUser?.id}
        />
      )}
    </div>
  );
}
