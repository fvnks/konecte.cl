
import Link from 'next/link';
import type { SearchRequest, PropertyType, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon, CalendarDays, Eye } from 'lucide-react';

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
    description, // Added for line-clamp
  } = request;

  const locationCity = desiredLocation?.city || 'No especificada';
  const authorName = author?.name || "Usuario Anónimo";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full">
       <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-1.5">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
              <AvatarImage src={authorAvatar || `https://placehold.co/40x40.png?text=${authorInitials}`} alt={authorName} data-ai-hint="persona solicitante" />
              <AvatarFallback className="text-sm">{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs sm:text-sm font-medium line-clamp-1" title={authorName}>{authorName}</p>
              <p className="text-xs text-muted-foreground flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" />
                {new Date(createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}
              </p>
            </div>
        </div>
        <Link href={`/requests/${slug}`} className="block">
          <CardTitle className="text-sm sm:text-base font-headline leading-snug hover:text-primary transition-colors line-clamp-2" title={title}>
            <SearchIcon className="inline-block h-4 w-4 mr-1.5 text-primary align-text-bottom" />
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 flex-grow">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2" title={description}>{description}</p>
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> 
            <span className="truncate">En: {locationCity}</span>
          </div>
          {desiredPropertyType && desiredPropertyType.length > 0 && (
             <div className="flex items-center">
                <Tag className="mr-1 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                <span className="truncate">Para: {desiredPropertyType.map(translatePropertyTypeBadge).join(', ')}</span>
             </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {desiredCategories && desiredCategories.slice(0, 2).map(cat => ( // Show max 2 categories for space
            <Badge key={cat} variant="secondary" className="text-[10px] sm:text-xs py-0.5 px-1.5 capitalize rounded-md">{translateCategoryBadge(cat)}</Badge>
          ))}
          {desiredCategories && desiredCategories.length > 2 && (
            <Badge variant="outline" className="text-[10px] sm:text-xs py-0.5 px-1.5 rounded-md">+{desiredCategories.length - 2}</Badge>
          )}
        </div>
         {budgetMax && (
             <div className="flex items-center text-xs text-muted-foreground mt-1.5">
              <DollarSign className="mr-1 h-3.5 w-3.5 text-primary/80 flex-shrink-0" /> 
              <span>Hasta ${budgetMax.toLocaleString('es-CL', {notation: 'compact'})}</span>
            </div>
          )}
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-2 border-t flex justify-between items-center mt-auto">
        <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
          <Button variant="ghost" size="sm" className="p-1 h-auto text-xs">
            <MessageCircle className="mr-1 h-3 w-3" />
            {commentsCount}
          </Button>
        </Link>
        <Button size="sm" asChild className="text-xs sm:text-sm rounded-md">
            <Link href={`/requests/${slug}`} className="flex items-center gap-1"> <Eye className="h-3.5 w-3.5" /> Ver</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

