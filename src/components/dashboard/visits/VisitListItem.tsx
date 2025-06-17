
// src/components/dashboard/visits/VisitListItem.tsx
'use client';

import React from 'react';
import type { PropertyVisit, PropertyVisitStatus, PropertyVisitAction } from '@/lib/types';
import { PropertyVisitStatusLabels } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, UserCircle, Building, AlertCircle, CheckCircle2, XCircle, History, CheckSquare, UserX, UserCheck, Clock, Edit3, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface VisitListItemProps {
  visit: PropertyVisit;
  currentUserId: string;
  onManageVisit: (visit: PropertyVisit, action: PropertyVisitAction) => void;
}

const getStatusVariant = (status: PropertyVisitStatus): { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; labelClass?: string } => {
  switch (status) {
    case 'pending_confirmation':
      return { variant: 'outline', icon: <History className="h-3.5 w-3.5" />, labelClass: 'text-amber-600 border-amber-500' };
    case 'confirmed':
      return { variant: 'default', icon: <CheckCircle2 className="h-3.5 w-3.5" />, labelClass: 'bg-green-500 hover:bg-green-600 text-white border-green-600' };
    case 'cancelled_by_visitor':
    case 'cancelled_by_owner':
      return { variant: 'destructive', icon: <XCircle className="h-3.5 w-3.5" />, labelClass: 'text-red-600' };
    case 'rescheduled_by_owner':
      return { variant: 'outline', icon: <Clock className="h-3.5 w-3.5" />, labelClass: 'text-blue-600 border-blue-500' };
    case 'completed':
      return { variant: 'default', icon: <CheckSquare className="h-3.5 w-3.5" />, labelClass: 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600' };
    case 'visitor_no_show':
      return { variant: 'destructive', icon: <UserX className="h-3.5 w-3.5" />, labelClass: 'text-slate-600 border-slate-500' };
    case 'owner_no_show':
      return { variant: 'destructive', icon: <UserCheck className="h-3.5 w-3.5" />, labelClass: 'text-slate-600 border-slate-500' };
    default:
      return { variant: 'secondary', icon: <AlertCircle className="h-3.5 w-3.5" />, labelClass: 'text-gray-600 border-gray-500' };
  }
};

export default function VisitListItem({ visit, currentUserId, onManageVisit }: VisitListItemProps) {
  const isVisitor = visit.visitor_user_id === currentUserId;
  const isOwner = visit.property_owner_user_id === currentUserId;

  const otherUser = isVisitor ? { name: visit.owner_name, avatarUrl: visit.owner_avatar_url } : { name: visit.visitor_name, avatarUrl: visit.visitor_avatar_url };
  const otherUserName = otherUser.name || (isVisitor ? 'Propietario' : 'Visitante');
  const otherUserAvatar = otherUser.avatarUrl;
  const otherUserInitials = otherUserName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const statusInfo = getStatusVariant(visit.status);
  
  // Date to display: if confirmed, show confirmed_datetime, otherwise proposed_datetime
  const displayDate = visit.confirmed_datetime || visit.proposed_datetime;
  const dateLabelSuffix = visit.status === 'confirmed' && visit.confirmed_datetime ? '(Confirmada)' 
                        : visit.status === 'rescheduled_by_owner' && visit.confirmed_datetime ? `(Reagendada por Propietario para ${format(new Date(visit.confirmed_datetime), "dd MMM, HH:mm", { locale: es })})`
                        : '(Propuesta)';


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border rounded-xl">
      <CardHeader className="p-4 flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={otherUserAvatar} alt={otherUserName} data-ai-hint="persona"/>
          <AvatarFallback className="text-lg bg-muted">{otherUserInitials || <UserCircle />}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base font-semibold leading-tight">
            {isVisitor ? 'Visita a Propiedad de' : 'Solicitud de Visita de'} {otherUserName}
          </CardTitle>
          {visit.property_title && (
            <Link href={`/properties/${visit.property_slug}`} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
               <Building className="h-3 w-3" /> {visit.property_title}
            </Link>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            {format(new Date(displayDate), "dd MMM yyyy, HH:mm", { locale: es })} {dateLabelSuffix}
          </p>
        </div>
        <Badge variant={statusInfo.variant} className={`capitalize text-xs h-fit ${statusInfo.labelClass} border-${statusInfo.labelClass?.replace('text-','')} dark:border-${statusInfo.labelClass?.replace('text-','').replace('-600','-400')}`}>
          {React.cloneElement(statusInfo.icon as React.ReactElement, { className: `mr-1.5 ${statusInfo.icon?.props.className}`})}
          {PropertyVisitStatusLabels[visit.status]}
        </Badge>
      </CardHeader>
      {(visit.visitor_notes || visit.owner_notes || visit.cancellation_reason) && (
        <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {isVisitor && visit.owner_notes && <p><strong>Notas del Propietario:</strong> {visit.owner_notes}</p>}
            {!isVisitor && visit.visitor_notes && <p><strong>Notas del Visitante:</strong> {visit.visitor_notes}</p>}
            {visit.cancellation_reason && <p><strong>Motivo Cancelación/Rechazo:</strong> {visit.cancellation_reason}</p>}
        </CardContent>
      )}
      <CardFooter className="p-4 pt-2 border-t flex flex-wrap gap-2 justify-end">
        {/* Acciones para el Propietario */}
        {isOwner && visit.status === 'pending_confirmation' && (
          <>
            <Button size="sm" variant="default" onClick={() => onManageVisit(visit, 'confirm_original_proposal')}>Confirmar Hora Original</Button>
            <Button size="sm" variant="outline" onClick={() => onManageVisit(visit, 'reschedule_proposal')}>Reagendar</Button>
            <Button size="sm" variant="destructive" onClick={() => onManageVisit(visit, 'cancel_pending_request')}>Rechazar</Button>
          </>
        )}
        {isOwner && visit.status === 'confirmed' && (
           <>
            <Button size="sm" variant="outline" onClick={() => onManageVisit(visit, 'mark_completed')}>Marcar Completada</Button>
            <Button size="sm" variant="outline" onClick={() => onManageVisit(visit, 'mark_visitor_no_show')}>Visitante No Asistió</Button>
            <Button size="sm" variant="destructive" onClick={() => onManageVisit(visit, 'cancel_confirmed_visit')}>Cancelar Confirmada</Button>
           </>
        )}
        {isOwner && visit.status === 'rescheduled_by_owner' && (
             <p className="text-xs text-muted-foreground italic w-full text-right">Esperando respuesta del visitante a la nueva propuesta.</p>
        )}


        {/* Acciones para el Visitante */}
        {isVisitor && visit.status === 'pending_confirmation' && (
          <Button size="sm" variant="destructive" onClick={() => onManageVisit(visit, 'cancel_own_request')}>Cancelar Solicitud</Button>
        )}
        {isVisitor && visit.status === 'rescheduled_by_owner' && (
          <>
            <Button size="sm" variant="default" onClick={() => onManageVisit(visit, 'accept_owner_reschedule')}>Aceptar Nueva Hora</Button>
            <Button size="sm" variant="destructive" onClick={() => onManageVisit(visit, 'reject_owner_reschedule')}>Rechazar Nueva Hora</Button>
          </>
        )}
         {isVisitor && visit.status === 'confirmed' && (
          <Button size="sm" variant="destructive" onClick={() => onManageVisit(visit, 'cancel_own_request')}>Cancelar Visita Confirmada</Button>
        )}
      </CardFooter>
    </Card>
  );
}

