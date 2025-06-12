
// src/components/request/RequestListItem.tsx
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, BedDouble, Bath, Eye, ArrowRight } from 'lucide-react';

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
  } = request;

  const locationCity = desiredLocation?.city || 'N/A';
  const locationNeighborhood = desiredLocation?.neighborhood;
  const authorName = author?.name || "Usuario Anónimo";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl w-full transform hover:-translate-y-1">
      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
        <div>
          <CardHeader className="p-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-3.5 mb-3">
              <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-border">
                <AvatarImage src={authorAvatar || `https://placehold.co/48x48.png?text=${authorInitials}`} alt={authorName} data-ai-hint="usuario buscando"/>
                <AvatarFallback className="text-base bg-muted">{authorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold">{authorName}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  Publicado el {new Date(createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <Link href={`/requests/${slug}`} className="block">
              <CardTitle className="text-xl sm:text-2xl font-headline leading-tight hover:text-primary transition-colors">
                <SearchIcon className="inline-block h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary align-middle" />
                {title}
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="p-0 mb-4 sm:mb-5">
            <p className="text-base text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
              {description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 text-base text-muted-foreground mb-3">
              <span className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0" /> {locationCity}{locationNeighborhood ? ` (${locationNeighborhood})` : ''}</span>
              {desiredPropertyType && desiredPropertyType.length > 0 && (
                <span className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0" /> {desiredPropertyType.map(translatePropertyTypeBadge).join(' / ')}</span>
              )}
              {minBedrooms !== undefined && (
                <span className="flex items-center"><BedDouble className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0" /> {minBedrooms}+ dorms.</span>
              )}
              {minBathrooms !== undefined && (
                <span className="flex items-center"><Bath className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0" /> {minBathrooms}+ baños</span>
              )}
              {budgetMax && (
                 <span className="flex items-center col-span-1 sm:col-span-2"><DollarSign className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0" /> Presupuesto: ${budgetMax.toLocaleString('es-CL')}</span>
              )}
            </div>
             <div className="mt-4 space-x-2 space-y-2">
              {desiredCategories && desiredCategories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-sm py-1.5 px-3 capitalize rounded-lg">{translateCategoryBadge(cat)}</Badge>
              ))}
            </div>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-4 sm:pt-5 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary text-base self-start sm:self-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            {commentsCount} comentarios
          </Link>
           <Button size="lg" variant="default" asChild className="text-base px-6 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto bg-primary hover:bg-primary/90 self-end sm:self-center">
            <Link href={`/requests/${slug}`} className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Ver Detalles
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
