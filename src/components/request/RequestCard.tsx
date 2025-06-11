
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types'; // Asegúrate que User esté importado si lo usas para author
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays } from 'lucide-react'; // CalendarDays añadido

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
    title,
    slug,
    desiredLocation,
    desiredCategories,
    author,
    commentsCount,
    budgetMax,
    desiredPropertyType,
    createdAt,
  } = request;

  const locationCity = desiredLocation?.city || 'No especificada';
  const locationNeighborhood = desiredLocation?.neighborhood;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
       <CardHeader className="p-4">
        <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatarUrl || `https://placehold.co/40x40.png?text=${author?.name?.charAt(0).toUpperCase()}`} alt={author?.name} data-ai-hint="persona" />
              <AvatarFallback>{author?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{author?.name || 'Usuario Desconocido'}</p>
              <p className="text-xs text-muted-foreground flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" /> {/* Icono y fecha añadidos */}
                Publicado el {new Date(createdAt).toLocaleDateString('es-CL')}
              </p>
            </div>
        </div>
        <Link href={`/requests/${slug}`} className="block">
          <CardTitle className="text-lg font-headline leading-tight hover:text-primary transition-colors">
            <SearchIcon className="inline-block h-5 w-5 mr-2 text-primary align-text-bottom" />
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" /> 
            <span>Ubicación: {locationCity} {locationNeighborhood ? `(${locationNeighborhood})` : ''}</span>
          </div>
          {desiredPropertyType && desiredPropertyType.length > 0 && (
             <div className="flex items-center">
                <Tag className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                <span>Para: {desiredPropertyType.map(translatePropertyTypeBadge).join(', ')}</span>
             </div>
          )}
          {desiredCategories && desiredCategories.length > 0 && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" /> 
              <span>Tipos: {desiredCategories.map(translateCategoryBadge).join(', ')}</span>
            </div>
          )}
          {budgetMax && (
             <div className="flex items-center">
              <DollarSign className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" /> 
              <span>Presupuesto: Hasta ${budgetMax.toLocaleString('es-CL')}</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          {desiredPropertyType && desiredPropertyType.map(pt => (
            <Badge key={pt} variant="secondary" className="mr-1.5 mb-1.5 text-xs py-0.5 px-1.5 capitalize">{translatePropertyTypeBadge(pt)}</Badge>
          ))}
          {desiredCategories && desiredCategories.map(cat => (
            <Badge key={cat} variant="outline" className="mr-1.5 mb-1.5 text-xs py-0.5 px-1.5 capitalize">{translateCategoryBadge(cat)}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 border-t flex justify-between items-center mt-auto">
        <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
          <Button variant="ghost" size="sm" className="p-1.5 h-auto text-xs">
            <MessageCircle className="mr-1 h-3.5 w-3.5" />
            {commentsCount} comentarios
          </Button>
        </Link>
        <Button size="sm" asChild>
            <Link href={`/requests/${slug}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
