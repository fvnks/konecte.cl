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
  if (currency.toUpperCase() === 'UF') {
    return `${new Intl.NumberFormat('es-CL').format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency }).format(price);
  } catch (e) {
    console.warn(`Invalid currency code for formatting: ${currency}. Falling back to simple number format.`);
    return `${new Intl.NumberFormat('es-CL').format(price)} ${currency}`;
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

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full flex flex-col md:flex-row">
      <Link href={`/properties/${slug}`} className="md:w-1/3 lg:w-1/4 block flex-shrink-0 group">
        <div className="relative aspect-video md:aspect-square w-full h-full overflow-hidden">
          <Image
            src={images[0] || 'https://placehold.co/400x300.png'}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="exterior propiedad"
          />
          <Badge variant="secondary" className="absolute top-2 left-2 capitalize">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <CardHeader className="p-0 mb-2">
          <Link href={`/properties/${slug}`} className="block">
            <CardTitle className="text-xl font-headline leading-tight hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </Link>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{city}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow mb-3">
          <div className="text-2xl font-semibold text-primary mb-2">
            {formatPrice(price, currency)}
            {propertyType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
            <div className="flex items-center">
              <BedDouble className="mr-1.5 h-4 w-4 text-primary" /> {bedrooms} dorms.
            </div>
            <div className="flex items-center">
              <Bath className="mr-1.5 h-4 w-4 text-primary" /> {bathrooms} baños
            </div>
            <div className="flex items-center">
              <HomeIcon className="mr-1.5 h-4 w-4 text-primary" /> {areaSqMeters} m²
            </div>
          </div>
          <Badge variant="outline" className="capitalize text-xs">
            <Tag className="mr-1 h-3 w-3" />
            {translateCategoryBadge(category)}
          </Badge>
        </CardContent>
        <CardFooter className="p-0 pt-3 border-t flex justify-between items-center mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="persona" />
              <AvatarFallback>{author.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">por {author.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-1.5 h-auto">
              <ArrowBigUp className="mr-1 h-4 w-4" />
              <span className="text-xs">{upvotes}</span>
            </Button>
            <Link href={`/properties/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
              <Button variant="ghost" size="sm" className="p-1.5 h-auto">
                <MessageCircle className="mr-1 h-4 w-4" />
                <span className="text-xs">{commentsCount}</span>
              </Button>
            </Link>
             <Button size="sm" asChild>
              <Link href={`/properties/${slug}`}>Ver Detalles</Link>
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
