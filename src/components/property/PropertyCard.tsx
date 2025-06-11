import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag } from 'lucide-react';

interface PropertyCardProps {
  property: PropertyListing;
}

const translatePropertyTypeBadge = (type: 'rent' | 'sale'): string => {
  if (type === 'rent') return 'Alquiler';
  if (type === 'sale') return 'Venta';
  return type;
}

const translateCategoryBadge = (category: ListingCategory): string => {
  switch (category) {
    case 'apartment': return 'Apartamento';
    case 'house': return 'Casa';
    case 'condo': return 'Condominio';
    case 'land': return 'Terreno';
    case 'commercial': return 'Comercial';
    case 'other': return 'Otro';
    default: return category;
  }
}

export default function PropertyCard({ property }: PropertyCardProps) {
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
  } = property;

  return (
    <Card className="flex flex-col sm:flex-row overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full">
      {/* Image Section */}
      <Link href={`/properties/${slug}`} className="sm:w-1/3 md:w-1/4 block flex-shrink-0 group">
        <div className="relative aspect-[16/10] h-full w-full overflow-hidden">
          <Image
            src={images[0] || 'https://placehold.co/600x400.png'}
            alt={title}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="apartment building"
          />
          <Badge variant="secondary" className="absolute top-2 left-2 capitalize">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-1 flex-col">
        <CardHeader className="p-4">
          <Link href={`/properties/${slug}`} className="block">
            <CardTitle className="text-lg font-headline leading-tight hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </Link>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{city}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="text-xl font-semibold text-primary mb-2">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(price)}
            {propertyType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <BedDouble className="mr-1.5 h-4 w-4" /> {bedrooms} habs
            </div>
            <div className="flex items-center">
              <Bath className="mr-1.5 h-4 w-4" /> {bathrooms} baños
            </div>
            <div className="flex items-center">
              <HomeIcon className="mr-1.5 h-4 w-4" /> {property.areaSqMeters} m²
            </div>
          </div>
          <Badge variant="outline" className="capitalize text-xs">
            <Tag className="mr-1 h-3 w-3" />
            {translateCategoryBadge(category)}
          </Badge>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={author.avatarUrl} alt={author.name} />
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
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
