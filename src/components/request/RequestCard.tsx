import Link from 'next/link';
import { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon } from 'lucide-react';

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
    desiredPropertyType
  } = request;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
       <CardHeader className="p-4">
        <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="person portrait" />
              <AvatarFallback>{author.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{author.name}</p>
              <p className="text-xs text-muted-foreground">Publicado el {new Date(request.createdAt).toLocaleDateString('es-CL')}</p>
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
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4 text-primary" /> Ubicación: {desiredLocation.city} {desiredLocation.neighborhood ? `(${desiredLocation.neighborhood})` : ''}
          </div>
          {desiredCategories.length > 0 && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4 text-primary" /> Tipos: {desiredCategories.map(translateCategoryBadge).join(', ')}
            </div>
          )}
           {desiredPropertyType.length > 0 && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4 text-primary" /> Para: {desiredPropertyType.map(translatePropertyTypeBadge).join(', ')}
            </div>
          )}
          {budgetMax && (
             <div className="flex items-center">
              <DollarSign className="mr-1.5 h-4 w-4 text-primary" /> Presupuesto: Hasta ${budgetMax.toLocaleString('es-CL')}
            </div>
          )}
        </div>
        <div className="mt-3">
          {desiredPropertyType.map(pt => (
            <Badge key={pt} variant="secondary" className="mr-1.5 mb-1.5 capitalize">{translatePropertyTypeBadge(pt)}</Badge>
          ))}
          {desiredCategories.map(cat => (
            <Badge key={cat} variant="outline" className="mr-1.5 mb-1.5 capitalize">{translateCategoryBadge(cat)}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end items-center border-t mt-auto">
        <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
          <Button variant="ghost" size="sm" className="p-1.5 h-auto">
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{commentsCount} comentarios</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
