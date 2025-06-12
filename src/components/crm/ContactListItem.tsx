
// src/components/crm/ContactListItem.tsx
import type { Contact } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Building, Edit3, Trash2, Info, UserCircle, History } from 'lucide-react';
import { contactStatusOptions } from '@/lib/types'; 
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
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface ContactListItemProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDeleteRequest: (contactId: string, contactName: string) => void;
  onViewInteractions: (contact: Contact) => void; 
}

export default function ContactListItem({ contact, onEdit, onDeleteRequest, onViewInteractions }: ContactListItemProps) {
  const statusLabel = contactStatusOptions.find(opt => opt.value === contact.status)?.label || contact.status;
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '';
    const names = name.trim().split(' ');
    if (names.length === 0 || names[0] === '') return '';
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const contactInitials = getInitials(contact.name);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12 border">
          <AvatarFallback className="text-lg bg-secondary text-secondary-foreground">
            {contactInitials || <UserCircle className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{contact.name}</CardTitle>
          {contact.company_name && (
            <CardDescription className="text-xs text-muted-foreground flex items-center">
              <Building className="h-3 w-3 mr-1" /> {contact.company_name}
            </CardDescription>
          )}
          <Badge variant={contact.status === 'won' ? 'default' : contact.status === 'lost' || contact.status === 'unqualified' ? 'destructive' : 'outline'} className="mt-1 text-xs capitalize">
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver interacciones" onClick={() => onViewInteractions(contact)}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar contacto" onClick={() => onEdit(contact)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          
          <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" title="Eliminar contacto">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto 
                  <span className="font-semibold"> {contact.name}</span> y todos sus datos asociados (incluyendo interacciones).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    onDeleteRequest(contact.id, contact.name);
                    setIsAlertDialogOpen(false);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sí, eliminar contacto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
        {contact.email && (
          <div className="flex items-center mb-1">
            <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
            <a href={`mailto:${contact.email}`} className="hover:underline break-all">{contact.email}</a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center">
            <Phone className="h-3.5 w-3.5 mr-2 text-primary" />
            <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
          </div>
        )}
        {contact.notes && (
            <p className="mt-2 text-xs border-l-2 border-primary/50 pl-2 italic line-clamp-2" title={contact.notes}>
                <Info className="h-3 w-3 mr-1 inline-block relative -top-px"/>
                {contact.notes}
            </p>
        )}
        {!contact.email && !contact.phone && !contact.notes && (
            <p className="mt-2 text-xs text-muted-foreground italic">No hay detalles adicionales.</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 text-xs text-muted-foreground flex justify-between items-center border-t">
        <span>Fuente: {contact.source || 'N/A'}</span>
        {contact.last_contacted_at ? (
            <span>Últ. contacto: {new Date(contact.last_contacted_at).toLocaleDateString('es-CL')}</span>
        ) : (
            contact.created_at && <span>Creado: {new Date(contact.created_at).toLocaleDateString('es-CL')}</span>
        )}
      </CardFooter>
    </Card>
  );
}
