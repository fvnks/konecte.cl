
// src/components/property/PropertyAuthorContactInfoClient.tsx
'use client';

import { useEffect, useState } from 'react';
import type { User as StoredUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, UserCircle, ShieldCheck, CalendarDays, Eye, Lock, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import RequestVisitButtonClient from './RequestVisitButtonClient';

interface PropertyAuthorContactInfoClientProps {
  author: StoredUser; // Author object now includes plan flags like plan_is_pro_or_premium
  contactEmail?: string | null;
  contactPhone?: string | null;
  propertyId: string; // Needed for RequestVisitButtonClient
  propertyTitle: string; // Needed for RequestVisitButtonClient
}

const getRoleDisplayName = (roleId?: string, roleName?: string): string | null => {
  if (roleName) return roleName;
  if (roleId === 'user') return 'Usuario';
  if (roleId === 'broker') return 'Corredor';
  if (roleId === 'admin') return 'Admin';
  return roleId || null;
};

export default function PropertyAuthorContactInfoClient({
  author,
  contactEmail,
  contactPhone,
  propertyId,
  propertyTitle,
}: PropertyAuthorContactInfoClientProps) {
  const [viewerUser, setViewerUser] = useState<StoredUser | null>(null);
  const [canViewContact, setCanViewContact] = useState(false);
  const [isLoadingViewer, setIsLoadingViewer] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setViewerUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Error parsing viewer user from localStorage:", e);
      }
    }
    setIsLoadingViewer(false);
  }, []);

  useEffect(() => {
    if (!author || isLoadingViewer) return;

    let shouldShow = false;
    const authorIsPayingBroker = author.role_id === 'broker' && author.plan_is_pro_or_premium;
    const authorIsPersonaNatural = author.role_id === 'user' && !author.plan_is_pro_or_premium;

    if (authorIsPayingBroker) { // Rule 1: Publisher is PRO/PREMIUM Broker
      shouldShow = true;
    } else if (authorIsPersonaNatural) {
      if (!viewerUser) { // Non-logged-in user viewing a persona natural
        shouldShow = false; 
      } else {
        const viewerIsPersonaNatural = viewerUser.role_id === 'user' && !viewerUser.plan_is_pro_or_premium;
        const viewerIsPremiumBroker = viewerUser.role_id === 'broker' && viewerUser.plan_is_premium_broker;

        if (viewerIsPersonaNatural) { // Rule 2: Both are Persona Natural
          shouldShow = true;
        } else if (viewerIsPremiumBroker) { // Rule 3: Viewer is PREMIUM Broker AND Publisher is Persona Natural
          shouldShow = true;
        }
      }
    }
    setCanViewContact(shouldShow);

  }, [author, viewerUser, isLoadingViewer]);

  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const authorRoleDisplay = getRoleDisplayName(author?.role_id, author?.role_name);

  const emailToDisplay = contactEmail || author?.email;
  const phoneToDisplay = contactPhone || author?.phone_number;

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-xl lg:text-2xl font-semibold mb-3 font-headline">Información del Anunciante</h3>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-secondary/30 p-4 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="agente inmobiliario"/>
          <AvatarFallback className="text-xl">{authorInitials || <UserCircle className="h-8 w-8"/>}</AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-0.5">
          <p className="font-semibold text-lg">{authorName}</p>
          {authorRoleDisplay && (
            <Badge variant="outline" className="text-xs capitalize border-primary/40 text-primary/90">
              <ShieldCheck className="h-3 w-3 mr-1"/> {authorRoleDisplay}
            </Badge>
          )}
          {author.created_at && (
            <p className="text-sm text-muted-foreground flex items-center">
              <CalendarDays className="h-4 w-4 mr-1.5"/>
              Miembro desde {new Date(author.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Propiedad publicada el {new Date(author.updated_at || author.created_at || Date.now()).toLocaleDateString('es-CL')}
          </p>
          
          {isLoadingViewer ? (
            <div className="mt-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando info de contacto...</div>
          ) : canViewContact ? (
            <div className="mt-2 space-y-1">
              {emailToDisplay && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-1.5 text-primary"/>
                  <a href={`mailto:${emailToDisplay}`} className="hover:underline text-primary">{emailToDisplay}</a>
                </p>
              )}
              {phoneToDisplay && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Phone className="h-4 w-4 mr-1.5 text-primary"/>
                  <a href={`tel:${phoneToDisplay}`} className="hover:underline text-primary">{phoneToDisplay}</a>
                </p>
              )}
              {(!emailToDisplay && !phoneToDisplay) && (
                 <p className="text-sm text-muted-foreground italic">El anunciante no ha proporcionado datos de contacto directo.</p>
              )}
            </div>
          ) : (
            <Card className="mt-3 bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 p-3">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Información de contacto protegida.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    {viewerUser ? "Tu plan actual no permite ver estos datos, o el anunciante es un particular." : "Inicia sesión para ver si puedes acceder a los datos de contacto."}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
        {!isOwner(viewerUser, author) && (
          <RequestVisitButtonClient 
            propertyId={propertyId}
            propertyOwnerId={author.id}
            propertyTitle={propertyTitle}
          />
        )}
      </div>
    </div>
  );
}

function isOwner(viewer: StoredUser | null, author: StoredUser): boolean {
    return !!viewer && viewer.id === author.id;
}


    
