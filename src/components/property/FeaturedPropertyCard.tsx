
// src/components/property/FeaturedPropertyCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedPropertyCardProps {
  property: PropertyListing;
}

const translatePropertyTypeBadge = (type: 'rent' | 'sale'): string => {
  if (type === 'rent') return 'Arriendo';
  if (type === 'sale') return 'Venta';
  return type;
}

const formatPriceCompact = (price: number, currency: string) => {
  if (currency?.toUpperCase() === 'UF') {
    return `${new Intl.NumberFormat('es-CL', { notation: 'compact', compactDisplay: 'short', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', notation: 'compact', compactDisplay: 'short', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch (e) {
    return `${new Intl.NumberFormat('es-CL', { notation: 'compact', compactDisplay: 'short', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)} ${currency || 'CLP'}`;
  }
};

export default function FeaturedPropertyCard({ property }: FeaturedPropertyCardProps) {
  const {
    title,
    slug,
    images,
    price,
    currency,
    city,
    propertyType,
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/300x200.png?text=Propiedad';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col h-full group">
      <Link href={`/properties/${slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            data-ai-hint="fachada propiedad compacta"
          />
          <Badge variant="default" className="absolute top-2 left-2 capitalize text-xs px-2 py-0.5 shadow-md bg-primary/90 text-primary-foreground rounded-md">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>
      <CardHeader className="p-3 sm:p-4 flex-grow">
        <Link href={`/properties/${slug}`} className="block">
          <CardTitle className="text-base sm:text-lg font-headline leading-snug hover:text-primary transition-colors line-clamp-2">
            {title}
          </CardTitle>
        </Link>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
          <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
          <span className="truncate">{city}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 mt-auto">
        <div className="text-lg sm:text-xl font-bold text-accent mb-2">
          {formatPriceCompact(price, currency)}
          {propertyType === 'rent' && <span className="text-xs font-normal text-muted-foreground">/mes</span>}
        </div>
        <Button size="sm" asChild className="w-full text-xs sm:text-sm rounded-md">
          <Link href={`/properties/${slug}`} className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Ver Detalles
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
