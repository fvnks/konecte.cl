// src/components/request/RequestCard.tsx
'use client';

import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, UserCircle as UserIcon, Handshake, Eye } from 'lucide-react';
import LikeButton from '@/components/ui/LikeButton';

interface RequestCardProps {
  request: SearchRequest;
}

const translatePropertyTypeBadge = (type: PropertyType): string => {
  if (type === 'rent') return 'Arriendo';
  if (type === 'sale') return 'Venta';
  return type;
}

const translateCategoryBadge = (category: ListingCategory): string => {
  switch (category) {
    case 'apartment': return 'Departamento';
    case 'house': return 'Casa';
    case 'condo': return 'Condominio';
    case 'land': return 'Terreno';
    case 'commercial': return 'Comercial';
    case 'other': return 'Otro';
    default: return category;
  }
}

export default function RequestCard({ request }: RequestCardProps) {
  const {
    id: requestId,
    title,
    slug,
    desiredLocation,
    desiredCategories,
    author,
    commentsCount,
    budgetMax,
    desiredPropertyType,
    createdAt,
    description,
    open_for_broker_collaboration,
    upvotes, // upvotes will be passed but LikeButton fetches its own initial state
  } = request;

  const locationCity = desiredLocation?.city || 'N/A';
  const locationNeighborhood = desiredLocation?.neighborhood;
  const authorName = author?.name || "Usuario Anónimo";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl h-full group border border-border hover:border-primary/30">
       <CardHeader className="p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border">
              <AvatarImage src={authorAvatar || `https://placehold.co/44x44.png?text=${authorInitials}`} alt={authorName} data-ai-hint="usuario buscando"/>
              <AvatarFallback className="text-sm bg-muted">{authorInitials || <UserIcon className="h-5 w-5"/>}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm sm:text-base font-semibold line-clamp-1" title={authorName}>{authorName}</p>
              <p className="text-xs text-muted-foreground flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" />
                Publicado el {new Date(createdAt).toLocaleDateString('es-CL', {day:'2-digit', month:'short', year:'numeric'})}
              </p>
            </div>
        </div>
        <Link href={`/requests/${slug}`} className="block">
          <CardTitle className="text-base sm:text-lg font-headline leading-snug hover:text-primary transition-colors line-clamp-2 h-[48px] sm:h-[56px]" title={title}>
            <SearchIcon className="inline-block h-4 w-4 sm:h-4 sm:w-4 mr-1.5 text-primary align-text-bottom" />
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0 flex-grow">
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-2.5 h-[48px] sm:h-[60px]" title={description}>{description}</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
            <span className="truncate">En: {locationCity}{locationNeighborhood ? ` (${locationNeighborhood})` : ''}</span>
          </div>
          {desiredPropertyType && desiredPropertyType.length > 0 && (
             <div className="flex items-center">
                <Tag className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                <span className="truncate">Para: {desiredPropertyType.map(translatePropertyTypeBadge).join(' / ')}</span>
             </div>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {desiredCategories && desiredCategories.slice(0, 3).map(cat => ( 
            <Badge key={cat} variant="secondary" className="text-[10px] sm:text-xs py-0.5 px-2 capitalize rounded-md">{translateCategoryBadge(cat)}</Badge>
          ))}
          {desiredCategories && desiredCategories.length > 3 && (
            <Badge variant="outline" className="text-[10px] sm:text-xs py-0.5 px-2 rounded-md">+{desiredCategories.length - 3}</Badge>
          )}
        </div>
         {budgetMax !== undefined && budgetMax > 0 && (
             <div className="flex items-center text-sm text-accent font-semibold mt-2">
              <DollarSign className="mr-1 h-4 w-4 text-accent/80 flex-shrink-0" />
              <span>Hasta ${budgetMax.toLocaleString('es-CL', {notation: 'compact', compactDisplay: 'short'})}</span>
            </div>
          )}
          {open_for_broker_collaboration && (
            <Badge variant="outline" className="mt-2.5 text-xs py-1 px-2.5 border-purple-500 text-purple-600 rounded-md">
                <Handshake className="h-3.5 w-3.5 mr-1.5" /> Abierta a Colaboración
            </Badge>
          )}
      </CardContent>
      <CardFooter className="p-4 sm:p-5 pt-2.5 border-t flex flex-col items-center gap-3 mt-auto">
        <div className="flex flex-col items-center w-full">
          <LikeButton listingId={requestId} listingType="request" className="mb-[10px]" />
          <Button size="sm" asChild className="text-xs sm:text-sm rounded-lg shadow-sm hover:shadow-md transition-shadow h-9 px-3.5 w-full max-w-xs">
            <Link href={`/requests/${slug}`} className="flex items-center gap-1.5"> <Eye className="h-4 w-4" /> Ver Solicitud</Link>
          </Button>
        </div>
        <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary text-xs sm:text-sm mt-1">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
          {commentsCount} comentarios
        </Link>
      </CardFooter>
    </Card>
  );
}