// src/components/crm/InteractionListItem.tsx
import type { Interaction, InteractionType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO, isPast, isToday } from 'date-fns'; 
import { es } from 'date-fns/locale';
import {
  StickyNote, MessageSquareText, Mail, PhoneOutgoing, PhoneIncoming, Users,
  Send, CheckSquare, Eye, Sparkles, History, Briefcase, Building, Trash2, AlertTriangle, 
  AlertCircle, 
} from 'lucide-react'; // Removed Edit3
import type { LucideIcon } from 'lucide-react';
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
import StyledEditButton from '@/components/ui/StyledEditButton'; // Import new button

interface InteractionListItemProps {
  interaction: Interaction;
  onDeleteRequest: (interactionId: string) => void;
  onEditRequest: (interaction: Interaction) => void;
}

const interactionTypeIcons: Record<InteractionType, LucideIcon> = {
  note: StickyNote,
  email_sent: Send,
  email_received: Mail,
  call_made: PhoneOutgoing,
  call_received: PhoneIncoming,
  meeting: Users,
  message_sent: MessageSquareText,
  message_received: MessageSquareText,
  task_completed: CheckSquare,
  property_viewing: Eye,
  offer_made: Briefcase,
  other: Sparkles,
};

const interactionTypeLabels: Record<InteractionType, string> = {
  note: 'Nota',
  email_sent: 'Email Enviado',
  email_received: 'Email Recibido',
  call_made: 'Llamada Realizada',
  call_received: 'Llamada Recibida',
  meeting: 'Reunión',
  message_sent: 'Mensaje Enviado',
  message_received: 'Mensaje Recibido',
  task_completed: 'Tarea Completada',
  property_viewing: 'Visita a Propiedad',
  offer_made: 'Oferta Realizada',
  other: 'Otro',
};

const interactionTypeColors: Record<InteractionType, string> = {
  note: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700',
  email_sent: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:border-blue-700',
  email_received: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-800/30 dark:text-sky-300 dark:border-sky-700',
  call_made: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700',
  call_received: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-800/30 dark:text-lime-300 dark:border-lime-700',
  meeting: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-800/30 dark:text-purple-300 dark:border-purple-700',
  message_sent: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-800/30 dark:text-teal-300 dark:border-teal-700',
  message_received: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-800/30 dark:text-cyan-300 dark:border-cyan-700',
  task_completed: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-800/30 dark:text-indigo-300 dark:border-indigo-700',
  property_viewing: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-800/30 dark:text-pink-300 dark:border-pink-700',
  offer_made: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-800/30 dark:text-orange-300 dark:border-orange-700',
  other: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600',
};


export default function InteractionListItem({ interaction, onDeleteRequest, onEditRequest }: InteractionListItemProps) {
  const IconComponent = interactionTypeIcons[interaction.interaction_type] || Sparkles;
  const typeLabel = interactionTypeLabels[interaction.interaction_type] || 'Interacción';
  const typeColorClass = interactionTypeColors[interaction.interaction_type] || interactionTypeColors.other;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const followUpDate = interaction.follow_up_date ? parseISO(interaction.interaction_date.split('T')[0] + 'T' + interaction.follow_up_date.split('T')[1]) : null;
  const parsedFollowUpDateOnly = interaction.follow_up_date ? parseISO(interaction.follow_up_date.split('T')[0]) : null;


  let followUpIsDueOrToday = false;
  let followUpStyle = "text-muted-foreground"; 
  let followUpIcon = null;

  if (interaction.follow_up_needed && parsedFollowUpDateOnly) {
    if (isPast(parsedFollowUpDateOnly) && !isToday(parsedFollowUpDateOnly)) {
      followUpIsDueOrToday = true;
      followUpStyle = "text-red-600 dark:text-red-500"; 
      followUpIcon = <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />;
    } else if (isToday(parsedFollowUpDateOnly)) {
      followUpIsDueOrToday = true;
      followUpStyle = "text-orange-500 dark:text-orange-400"; 
      followUpIcon = <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />;
    } else { 
      followUpStyle = "text-green-600 dark:text-green-500"; 
    }
  } else if (interaction.follow_up_needed) {
     followUpStyle = "text-blue-500 dark:text-blue-400"; 
  }


  return (
    <Card className="shadow-sm border-l-4 border-primary/50 relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
        <StyledEditButton 
          onClick={() => onEditRequest(interaction)}
          title="Editar Interacción"
        />
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" title="Eliminar Interacción">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive" />Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar esta interacción? ({typeLabel} del {format(parseISO(interaction.interaction_date), "dd MMM yyyy", { locale: es })})
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeleteRequest(interaction.id);
                  setIsDeleteDialogOpen(false);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sí, Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="p-3 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2 flex-shrink min-w-0">
          <Badge variant="outline" className={`text-xs px-2 py-0.5 border whitespace-nowrap ${typeColorClass}`}>
            <IconComponent className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            {typeLabel}
          </Badge>
          {interaction.subject && (
            <p className="text-sm font-medium text-foreground truncate" title={interaction.subject}>
              {interaction.subject}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {format(parseISO(interaction.interaction_date), "dd MMM yyyy, HH:mm", { locale: es })}
        </p>
      </div>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{interaction.description}</p>

        {(interaction.outcome || interaction.follow_up_needed) && (
            <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                {interaction.outcome && (
                    <p className="text-xs"><strong>Resultado:</strong> {interaction.outcome}</p>
                )}
                {interaction.follow_up_needed && (
                    <p className={`text-xs font-semibold ${followUpStyle} flex items-center`}>
                        {followUpIcon}
                        Requiere seguimiento
                        {parsedFollowUpDateOnly && ` para el ${format(parsedFollowUpDateOnly, "dd MMM yyyy", { locale: es })}`}
                    </p>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
