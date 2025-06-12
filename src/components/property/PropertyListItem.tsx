
// src/components/property/PropertyListItem.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag, Eye, ArrowRight } from 'lucide-react';

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
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch (e) {
    // Fallback for unknown currency or formatting issues
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)} ${currency || 'CLP'}`;
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

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/320x240.png?text=Propiedad';
  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();


  return (
    <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl w-full flex flex-col md:flex-row group transform hover:-translate-y-1">
      <Link href={`/properties/${slug}`} className="md:w-[280px] lg:w-[320px] block flex-shrink-0 relative">
        <div className="aspect-w-4 aspect-h-3 md:aspect-w-1 md:aspect-h-1 w-full h-full overflow-hidden md:rounded-l-2xl md:rounded-r-none rounded-t-2xl">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (min-width: 768px) 280px, (min-width: 1024px) 320px"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            data-ai-hint="fachada casa departamento"
          />
          <Badge variant="default" className="absolute top-3 left-3 capitalize text-xs px-2.5 py-1 shadow-md bg-primary/90 text-primary-foreground rounded-md">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between">
        <div>
          <CardHeader className="p-0 mb-2 sm:mb-3">
            <Link href={`/properties/${slug}`} className="block">
              <CardTitle className="text-xl sm:text-2xl font-headline leading-tight hover:text-primary transition-colors line-clamp-2">
                {title}
              </CardTitle>
            </Link>
            <div className="flex items-center text-sm text-muted-foreground mt-1.5">
              <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-primary/70" />
              <span>{city}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 mb-3 sm:mb-4">
            <div className="text-2xl sm:text-3xl font-bold text-accent mb-2"> {/* Accent color for price */}
              {formatPrice(price, currency)}
              {propertyType === 'rent' && <span className="text-base font-normal text-muted-foreground">/mes</span>}
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed"> {/* Increased line clamp and leading */}
              {description}
            </p>
            <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center"><BedDouble className="mr-1.5 h-4 w-4 text-primary/80" /> {bedrooms} dorms.</span>
              <span className="flex items-center"><Bath className="mr-1.5 h-4 w-4 text-primary/80" /> {bathrooms} baños</span>
              <span className="flex items-center"><HomeIcon className="mr-1.5 h-4 w-4 text-primary/80" /> {areaSqMeters} m²</span>
            </div>
            <Badge variant="secondary" className="capitalize text-xs mt-3 px-2.5 py-1 rounded-md">
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              {translateCategoryBadge(category)}
            </Badge>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-4 sm:pt-5 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-border">
              <AvatarImage src={authorAvatar || `https://placehold.co/40x40.png?text=${authorInitials}`} alt={authorName} data-ai-hint="agente inmobiliario" />
              <AvatarFallback className="text-sm bg-muted">{authorInitials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">Por {authorName}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-1.5 h-auto text-xs">
              <ArrowBigUp className="mr-1 h-4 w-4" />
              <span>{upvotes}</span>
            </Button>
            <Link href={`/properties/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
              <Button variant="ghost" size="sm" className="p-1.5 h-auto text-xs">
                <MessageCircle className="mr-1 h-4 w-4" />
                <span>{commentsCount}</span>
              </Button>
            </Link>
             <Button size="default" variant="default" asChild className="text-sm px-4 h-10 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90">
              <Link href={`/properties/${slug}`} className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Ver Detalles
              </Link>
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
