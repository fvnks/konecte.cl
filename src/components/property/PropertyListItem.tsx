
// src/components/property/PropertyListItem.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag } from 'lucide-react';

interface PropertyListItemProps {
  property: PropertyListing;
}

const translatePropertyTypeBadge = (type: 'rent' | 'sale'): string => {
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

const formatPrice = (price: number, currency: string) => {
  if (currency?.toUpperCase() === 'UF') {
    return `${new Intl.NumberFormat('es-CL').format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP' }).format(price);
  } catch (e) {
    // console.warn(`Invalid currency code for formatting: ${currency}. Falling back to simple number format.`);
    return `${new Intl.NumberFormat('es-CL').format(price)} ${currency || 'CLP'}`;
  }
};

export default function PropertyListItem({ property }: PropertyListItemProps) {
  const {
    title,
    slug,
    images,
    price,
    currency,
    city,
    bedrooms,
    bathrooms,
    category,
    author,
    upvotes,
    commentsCount,
    propertyType,
    areaSqMeters,
    description,
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/300x225.png';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg w-full flex flex-col md:flex-row">
      <Link href={`/properties/${slug}`} className="md:w-[180px] lg:w-[220px] block flex-shrink-0 group">
        <div className="relative aspect-[4/3] w-full h-full overflow-hidden md:aspect-auto">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (min-width: 768px) 180px, (min-width: 1024px) 220px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="exterior propiedad"
          />
          <Badge variant="secondary" className="absolute top-1.5 left-1.5 capitalize text-xs px-1.5 py-0.5">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5 justify-between">
        <div>
          <CardHeader className="p-0 mb-1 sm:mb-1.5">
            <Link href={`/properties/${slug}`} className="block">
              <CardTitle className="text-base sm:text-md font-headline leading-tight hover:text-primary transition-colors line-clamp-2">
                {title}
              </CardTitle>
            </Link>
            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              <span>{city}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 mb-1.5 sm:mb-2">
            <div className="text-md sm:text-lg font-semibold text-primary mb-1">
              {formatPrice(price, currency)}
              {propertyType === 'rent' && <span className="text-xs font-normal text-muted-foreground">/mes</span>}
            </div>
            <p className="text-xs text-muted-foreground mb-1 line-clamp-1 sm:line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center"><BedDouble className="mr-0.5 h-3 w-3 text-primary" /> {bedrooms} dorms.</span>
              <span className="flex items-center"><Bath className="mr-0.5 h-3 w-3 text-primary" /> {bathrooms} baños</span>
              <span className="flex items-center"><HomeIcon className="mr-0.5 h-3 w-3 text-primary" /> {areaSqMeters} m²</span>
            </div>
            <Badge variant="outline" className="capitalize text-xs mt-1 px-1 py-0">
              <Tag className="mr-1 h-2.5 w-2.5" />
              {translateCategoryBadge(category)}
            </Badge>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-1.5 sm:pt-2 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-0">
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
              <AvatarImage src={author?.avatarUrl || `https://placehold.co/40x40.png?text=${author?.name?.charAt(0).toUpperCase()}`} alt={author?.name} data-ai-hint="persona" />
              <AvatarFallback className="text-xs">{author?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">por {author?.name || 'Desconocido'}</span>
          </div>
          <div className="flex items-center gap-1 self-end sm:self-center">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-0.5 h-auto text-xs">
              <ArrowBigUp className="mr-0.5 h-3 w-3" />
              <span>{upvotes}</span>
            </Button>
            <Link href={`/properties/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
              <Button variant="ghost" size="sm" className="p-0.5 h-auto text-xs">
                <MessageCircle className="mr-0.5 h-3 w-3" />
                <span>{commentsCount}</span>
              </Button>
            </Link>
             <Button size="sm" asChild className="text-xs px-2 h-7">
              <Link href={`/properties/${slug}`}>Ver Detalles</Link>
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
