'use client';

import React from 'react';
import { Calendar, dateFnsLocalizer, Views, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { PropertyVisit } from '@/lib/types';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

interface VisitsCalendarProps {
  visits: PropertyVisit[];
}

interface VisitEvent extends Event {
  resource: {
    visit: PropertyVisit;
  };
}

export default function VisitsCalendar({ visits }: VisitsCalendarProps) {
  const events: VisitEvent[] = visits
    .filter(visit => visit.status === 'confirmed' || visit.status === 'completed')
    .map((visit: PropertyVisit) => {
      const visitDate = visit.confirmed_datetime ? new Date(visit.confirmed_datetime) : new Date(visit.proposed_datetime);
      
      return {
        title: `${visit.property_title} - con ${visit.visitor_name}`,
        start: visitDate,
        end: new Date(visitDate.getTime() + 60 * 60 * 1000), // Asume 1 hora de duración
        resource: {
          visit,
        },
      };
    });

  return (
    <div className="h-[75vh] bg-white p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "No hay visitas en este rango.",
          showMore: total => `+ Ver más (${total})`
        }}
        eventPropGetter={(event) => {
          const visitStatus = event.resource.visit.status;
          let backgroundColor = '#3174ad'; // color por defecto (confirmed)
          if (visitStatus === 'completed') {
            backgroundColor = '#5cb85c'; // verde para completadas
          }
          return { style: { backgroundColor, borderColor: backgroundColor } };
        }}
      />
    </div>
  );
} 