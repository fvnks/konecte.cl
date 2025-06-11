
// src/components/request/RequestListItem.tsx
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays } from 'lucide-react';

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
  } = request;

  const locationCity = desiredLocation?.city || 'No especificada';
  const locationNeighborhood = desiredLocation?.neighborhood;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full flex flex-col md:flex-row">
      <div className="flex flex-1 flex-col p-4">
        <CardHeader className="p-0 mb-2">
           <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatarUrl || `https://placehold.co/40x40.png?text=${author?.name?.charAt(0).toUpperCase()}`} alt={author?.name} data-ai-hint="persona" />
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
            <CardTitle className="text-xl font-headline leading-tight hover:text-primary transition-colors">
              <SearchIcon className="inline-block h-5 w-5 mr-1.5 text-primary align-text-bottom" />
              {title}
            </CardTitle>
          </Link>
        </CardHeader>
        <CardContent className="p-0 flex-grow mb-3">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
          <div className="space-y-1 text-sm text-muted-foreground mb-2">
            <div className="flex items-center">
              <MapPin className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" /> 
              <span><strong>Ubicación:</strong> {locationCity} {locationNeighborhood ? `(${locationNeighborhood})` : ''}</span>
            </div>
            {desiredPropertyType && desiredPropertyType.length > 0 && (
                <div className="flex items-center">
                    <Tag className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                    <span><strong>Tipo Transacción:</strong> {desiredPropertyType.map(translatePropertyTypeBadge).join(', ')}</span>
                </div>
            )}
            {desiredCategories && desiredCategories.length > 0 && (
              <div className="flex items-center">
                <Tag className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                <span><strong>Tipo Propiedad:</strong> {desiredCategories.map(translateCategoryBadge).join(', ')}</span>
              </div>
            )}
            {budgetMax && (
               <div className="flex items-center">
                <DollarSign className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" /> 
                <span><strong>Presupuesto Máx.:</strong> ${budgetMax.toLocaleString('es-CL')}</span>
              </div>
            )}
          </div>
           <div className="mt-2">
            {desiredPropertyType && desiredPropertyType.map(pt => (
                <Badge key={pt} variant="secondary" className="mr-1 mb-1 text-xs py-0.5 px-1.5 capitalize">{translatePropertyTypeBadge(pt)}</Badge>
            ))}
            {desiredCategories && desiredCategories.map(cat => (
                <Badge key={cat} variant="outline" className="mr-1 mb-1 text-xs py-0.5 px-1.5 capitalize">{translateCategoryBadge(cat)}</Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-0 pt-3 border-t flex justify-between items-center mt-auto">
          <div className="flex items-center gap-3">
            <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
              <Button variant="ghost" size="sm" className="p-1.5 h-auto text-xs">
                <MessageCircle className="mr-1 h-3.5 w-3.5" />
                {commentsCount} comentarios
              </Button>
            </Link>
          </div>
           <Button size="sm" asChild>
            <Link href={`/requests/${slug}`}>Ver Detalles</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
