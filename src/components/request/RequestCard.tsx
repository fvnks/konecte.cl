
// src/components/request/RequestCard.tsx
'use client';

import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory, User } from '@/lib/types'; // Import User type
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, UserCircle as UserIcon, Handshake, Eye, BedDouble, Bath, ShieldCheck } from 'lucide-react'; // Added BedDouble, Bath, ShieldCheck
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

const getRoleDisplayName = (roleId?: string, roleName?: string): string | null => {
  if (roleName) return roleName;
  if (roleId === 'user') return 'Usuario';
  if (roleId === 'broker') return 'Corredor';
  if (roleId === 'admin') return 'Admin';
  return roleId || null;
};

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
    minBedrooms,
    minBathrooms,
  } = request;

  const locationCity = desiredLocation?.city || 'N/A';
  const locationNeighborhood = desiredLocation?.neighborhood;
  const authorName = author?.name || "Usuario Anónimo";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const authorRoleDisplay = getRoleDisplayName(author?.role_id, author?.role_name);

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl h-full group border border-border hover:border-primary/30">
       <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start gap-2.5 mb-2.5">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border">
              <AvatarImage src={authorAvatar || `https://placehold.co/44x44.png?text=${authorInitials}`} alt={authorName} data-ai-hint="usuario buscando"/>
              <AvatarFallback className="text-sm bg-muted">{authorInitials || <UserIcon className="h-5 w-5"/>}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-semibold line-clamp-1" title={authorName}>{authorName}</p>
              {authorRoleDisplay && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-primary/30 text-primary/80 capitalize">
                    <ShieldCheck className="h-2.5 w-2.5 mr-0.5"/>{authorRoleDisplay}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                <CalendarDays className="h-3 w-3 mr-1" />
                Publicado el {new Date(createdAt).toLocaleDateString('es-CL', {day:'2-digit', month:'short', year:'numeric'})}
              </p>
            </div>
             {open_for_broker_collaboration && (
                <Badge variant="outline" className="text-xs py-1 px-2.5 border-purple-500 text-purple-600 h-fit rounded-md whitespace-nowrap">
                    <Handshake className="h-3.5 w-3.5 mr-1.5" /> Colaboración
                </Badge>
            )}
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
          {(minBedrooms !== undefined || minBathrooms !== undefined) && (
            <div className="flex flex-wrap gap-x-3">
              {minBedrooms !== undefined && <span className="flex items-center"><BedDouble className="mr-1 h-3.5 w-3.5 text-primary/80" /> {minBedrooms}+ dorms.</span>}
              {minBathrooms !== undefined && <span className="flex items-center"><Bath className="mr-1 h-3.5 w-3.5 text-primary/80" /> {minBathrooms}+ baños</span>}
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
