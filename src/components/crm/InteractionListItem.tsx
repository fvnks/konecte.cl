
// src/components/crm/InteractionListItem.tsx
import type { Interaction, InteractionType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  StickyNote, MessageSquareText, Mail, PhoneOutgoing, PhoneIncoming, Users, 
  Send, CheckSquare, Eye, Sparkles, History, Briefcase, Building
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InteractionListItemProps {
  interaction: Interaction;
}

const interactionTypeIcons: Record<InteractionType, LucideIcon> = {
  note: StickyNote,
  email_sent: Send,
  email_received: Mail,
  call_made: PhoneOutgoing,
  call_received: PhoneIncoming,
  meeting: Users,
  message_sent: MessageSquareText,
  message_received: MessageSquareText, // Could be different if needed
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
  note: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  email_sent: 'bg-blue-100 text-blue-800 border-blue-300',
  email_received: 'bg-sky-100 text-sky-800 border-sky-300',
  call_made: 'bg-green-100 text-green-800 border-green-300',
  call_received: 'bg-lime-100 text-lime-800 border-lime-300',
  meeting: 'bg-purple-100 text-purple-800 border-purple-300',
  message_sent: 'bg-teal-100 text-teal-800 border-teal-300',
  message_received: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  task_completed: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  property_viewing: 'bg-pink-100 text-pink-800 border-pink-300',
  offer_made: 'bg-orange-100 text-orange-800 border-orange-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300',
};


export default function InteractionListItem({ interaction }: InteractionListItemProps) {
  const IconComponent = interactionTypeIcons[interaction.interaction_type] || Sparkles;
  const typeLabel = interactionTypeLabels[interaction.interaction_type] || 'Interacción';
  const typeColorClass = interactionTypeColors[interaction.interaction_type] || interactionTypeColors.other;

  return (
    <Card className="shadow-sm border-l-4 border-primary/50">
      <CardHeader className="p-3 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs px-2 py-0.5 border ${typeColorClass}`}>
            <IconComponent className="h-3.5 w-3.5 mr-1.5" />
            {typeLabel}
          </Badge>
          {interaction.subject && (
            <p className="text-sm font-medium text-foreground truncate" title={interaction.subject}>
              {interaction.subject}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {format(parseISO(interaction.interaction_date), "dd MMM yyyy, HH:mm", { locale: es })}
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.description}</p>
        
        {(interaction.outcome || interaction.follow_up_needed) && (
            <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                {interaction.outcome && (
                    <p className="text-xs"><strong>Resultado:</strong> {interaction.outcome}</p>
                )}
                {interaction.follow_up_needed && (
                    <p className={`text-xs font-semibold ${interaction.follow_up_date ? 'text-orange-600' : 'text-blue-600'}`}>
                        Requiere seguimiento
                        {interaction.follow_up_date && ` para el ${format(parseISO(interaction.follow_up_date), "dd MMM yyyy", { locale: es })}`}
                    </p>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
