
// src/components/request/RequestListItem.tsx
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, BedDouble, Bath, Eye } from 'lucide-react';

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

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl w-full">
      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between">
        <div>
          <CardHeader className="p-0 mb-2 sm:mb-3">
            <div className="flex items-center gap-3 mb-2.5">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11">
                <AvatarImage src={author?.avatarUrl || `https://placehold.co/44x44.png?text=${author?.name?.charAt(0).toUpperCase()}`} alt={author?.name} data-ai-hint="usuario buscando"/>
                <AvatarFallback className="text-sm">{author?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{author?.name || 'Usuario Desconocido'}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  Publicado el {new Date(createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <Link href={`/requests/${slug}`} className="block">
              <CardTitle className="text-lg sm:text-xl font-headline leading-tight hover:text-primary transition-colors">
                <SearchIcon className="inline-block h-5 w-5 mr-1.5 text-primary align-text-bottom" />
                {title}
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="p-0 mb-3 sm:mb-4">
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-2">
              <span className="flex items-center col-span-2 sm:col-span-1"><MapPin className="mr-1.5 h-4 w-4 text-primary/80 flex-shrink-0" /> {locationCity}{locationNeighborhood ? ` (${locationNeighborhood})` : ''}</span>
              {desiredPropertyType && desiredPropertyType.length > 0 && (
                <span className="flex items-center"><Tag className="mr-1.5 h-4 w-4 text-primary/80 flex-shrink-0" /> {desiredPropertyType.map(translatePropertyTypeBadge).join(' / ')}</span>
              )}
              {minBedrooms !== undefined && (
                <span className="flex items-center"><BedDouble className="mr-1.5 h-4 w-4 text-primary/80 flex-shrink-0" /> {minBedrooms}+ dorms.</span>
              )}
              {minBathrooms !== undefined && (
                <span className="flex items-center"><Bath className="mr-1.5 h-4 w-4 text-primary/80 flex-shrink-0" /> {minBathrooms}+ baños</span>
              )}
              {budgetMax && (
                 <span className="flex items-center col-span-2 sm:col-span-1"><DollarSign className="mr-1.5 h-4 w-4 text-primary/80 flex-shrink-0" /> Presupuesto: ${budgetMax.toLocaleString('es-CL')}</span>
              )}
            </div>
             <div className="mt-3 space-x-1.5 space-y-1.5">
              {desiredCategories && desiredCategories.map(cat => (
                  <Badge key={cat} variant="outline" className="text-xs py-1 px-2 capitalize rounded-md">{translateCategoryBadge(cat)}</Badge>
              ))}
            </div>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-3 sm:pt-4 border-t flex justify-between items-center">
          <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary text-sm">
            <MessageCircle className="mr-1.5 h-4 w-4" />
            {commentsCount} comentarios
          </Link>
           <Button size="sm" asChild className="text-xs px-3 h-8 rounded-md">
            <Link href={`/requests/${slug}`} className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Ver Detalles
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

