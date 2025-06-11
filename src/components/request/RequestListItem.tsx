
// src/components/request/RequestListItem.tsx
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, BedDouble, Bath } from 'lucide-react';

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
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg w-full flex flex-col md:flex-row">
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <CardHeader className="p-0 mb-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={author?.avatarUrl || `https://placehold.co/40x40.png?text=${author?.name?.charAt(0).toUpperCase()}`} alt={author?.name} data-ai-hint="persona"/>
                <AvatarFallback>{author?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{author?.name || 'Usuario Desconocido'}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  Publicado el {new Date(createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <Link href={`/requests/${slug}`} className="block">
              <CardTitle className="text-lg font-headline leading-tight hover:text-primary transition-colors">
                <SearchIcon className="inline-block h-5 w-5 mr-1.5 text-primary align-text-bottom" />
                {title}
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="p-0 mb-3">
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center"><MapPin className="mr-1 h-3.5 w-3.5 text-primary" /> {locationCity}{locationNeighborhood ? ` (${locationNeighborhood})` : ''}</span>
              {desiredPropertyType && desiredPropertyType.length > 0 && (
                <span className="flex items-center"><Tag className="mr-1 h-3.5 w-3.5 text-primary" /> {desiredPropertyType.map(translatePropertyTypeBadge).join('/')}</span>
              )}
              {budgetMax && (
                 <span className="flex items-center"><DollarSign className="mr-1 h-3.5 w-3.5 text-primary" /> Presupuesto: ${budgetMax.toLocaleString('es-CL')}</span>
              )}
               {minBedrooms !== undefined && (
                <span className="flex items-center"><BedDouble className="mr-1 h-3.5 w-3.5 text-primary" /> {minBedrooms}+ dorms</span>
              )}
              {minBathrooms !== undefined && (
                <span className="flex items-center"><Bath className="mr-1 h-3.5 w-3.5 text-primary" /> {minBathrooms}+ baños</span>
              )}
            </div>
             <div className="mt-2">
              {desiredCategories && desiredCategories.map(cat => (
                  <Badge key={cat} variant="outline" className="mr-1 mb-1 text-xs py-0.5 px-1.5 capitalize">{translateCategoryBadge(cat)}</Badge>
              ))}
            </div>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-3 border-t flex justify-between items-center">
          <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary text-xs">
            <MessageCircle className="mr-1 h-3.5 w-3.5" />
            {commentsCount} comentarios
          </Link>
           <Button size="sm" asChild>
            <Link href={`/requests/${slug}`}>Ver Detalles</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
