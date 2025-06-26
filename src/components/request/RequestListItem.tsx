// src/components/request/RequestListItem.tsx
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, BedDouble, Bath, Eye, UserCircle as UserIcon, Handshake } from 'lucide-react';
import AuthorInfoDialog from '../property/AuthorInfoDialog';
import ClientFormattedDate from '@/components/ui/ClientFormattedDate';

interface RequestListItemProps {
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

export default function RequestListItem({ request }: RequestListItemProps) {
  const {
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
    minBedrooms,
    minBathrooms,
    open_for_broker_collaboration,
    pub_id,
  } = request;

  const locationCity = desiredLocation?.city || 'N/A';
  const locationNeighborhood = desiredLocation?.neighborhood;
  const authorName = author?.name || "Usuario Anónimo";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const authorDisplay = (
    <div className="flex items-center gap-2.5 mb-2.5 cursor-pointer group/author rounded-md p-1 -ml-1 hover:bg-accent/50 transition-colors">
      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border">
          <AvatarImage src={authorAvatar || `https://placehold.co/40x40.png?text=${authorInitials}`} alt={authorName} data-ai-hint="usuario buscando"/>
          <AvatarFallback className="text-sm bg-muted">{authorInitials}</AvatarFallback>
      </Avatar>
      <div>
          <p className="text-sm font-medium line-clamp-1 group-hover/author:text-primary transition-colors" title={authorName}>{authorName}</p>
          <p className="text-xs text-muted-foreground flex items-center">
          <CalendarDays className="h-3 w-3 mr-1" />
          <ClientFormattedDate date={createdAt} prefix="Publicado el " options={{day:'2-digit', month:'short', year:'numeric'}}/>
          </p>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl w-full group border border-border hover:border-primary/30 relative">
       {pub_id && (
        <Badge variant="outline" className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 shadow-md rounded-md bg-black/50 text-white backdrop-blur-sm font-mono z-10">
          {pub_id}
        </Badge>
      )}
      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between">
        <div>
          <CardHeader className="p-0 mb-2 sm:mb-3">
            <div className="flex items-center justify-between">
                {author ? (
                    <AuthorInfoDialog author={author}>
                        {authorDisplay}
                    </AuthorInfoDialog>
                ) : <div />}
                {open_for_broker_collaboration && (
                    <Badge variant="outline" className="text-xs py-1 px-2.5 border-purple-500 text-purple-600 h-fit rounded-md">
                        <Handshake className="h-3.5 w-3.5 mr-1.5" /> Colaboración
                    </Badge>
                )}
            </div>
            <Link href={`/requests/${slug}`} className="block">
              <CardTitle className="text-lg sm:text-xl font-headline leading-tight hover:text-primary transition-colors line-clamp-2">
                <SearchIcon className="inline-block h-4 w-4 sm:h-5 sm:w-5 mr-1.5 text-primary align-middle" />
                {title}
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="p-0 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">
              {description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground mb-1.5">
              <span className="flex items-center truncate"><MapPin className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> {locationCity}{locationNeighborhood ? ` (${locationNeighborhood})` : ''}</span>
              {desiredPropertyType && desiredPropertyType.length > 0 && (
                <span className="flex items-center truncate"><Tag className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> {desiredPropertyType.map(translatePropertyTypeBadge).join(' / ')}</span>
              )}
              {minBedrooms !== undefined && (
                <span className="flex items-center"><BedDouble className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> {minBedrooms}+ dorms.</span>
              )}
              {minBathrooms !== undefined && (
                <span className="flex items-center"><Bath className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> {minBathrooms}+ baños</span>
              )}
            </div>
            {budgetMax !== undefined && budgetMax > 0 && (
                <span className="flex items-center text-sm text-accent font-semibold"><DollarSign className="mr-1 h-4 w-4 text-accent/80 flex-shrink-0" /> Hasta ${budgetMax.toLocaleString('es-CL')}</span>
            )}
            <div className="mt-2.5 space-x-1.5 space-y-1.5">
              {desiredCategories && desiredCategories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs py-0.5 px-2 capitalize rounded-md">{translateCategoryBadge(cat)}</Badge>
              ))}
            </div>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-2.5 sm:pt-3 border-t flex flex-wrap justify-between items-center gap-2">
          <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary text-xs sm:text-sm">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            {commentsCount} comentarios
          </Link>
           <Button size="sm" asChild className="text-xs sm:text-sm px-3.5 h-9 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/requests/${slug}`} className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Ver Solicitud
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
