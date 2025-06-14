// src/components/property/FeaturedPropertyCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, DollarSign, CalendarDays, UserCircle as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    author,
    createdAt,
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/300x200.png?text=Propiedad';
  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col h-full group border">
      <Link href={`/properties/${slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint="fachada propiedad compacta"
          />
          <Badge variant="default" className="absolute top-2.5 left-2.5 capitalize text-xs px-2 py-0.5 shadow-md bg-primary/90 text-primary-foreground rounded-md">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>
      <CardHeader className="p-3 sm:p-4 flex-grow">
        <Link href={`/properties/${slug}`} className="block">
          <CardTitle className="text-base sm:text-lg font-headline leading-snug hover:text-primary transition-colors line-clamp-2 h-[48px] sm:h-[56px]">
            {title}
          </CardTitle>
        </Link>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
          <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
          <span className="truncate">{city}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
         <div className="text-lg sm:text-xl font-bold text-accent mb-2 flex items-center">
          <DollarSign className="h-5 w-5 mr-1 text-accent/80" />
          {formatPriceCompact(price, currency)}
          {propertyType === 'rent' && <span className="text-xs font-normal text-muted-foreground ml-1">/mes</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar || `https://placehold.co/24x24.png?text=${authorInitials}`} alt={authorName} data-ai-hint="agente inmobiliario"/>
              <AvatarFallback className="text-[10px] bg-muted">{authorInitials || <UserIcon className="h-3 w-3"/>}</AvatarFallback>
            </Avatar>
            <span className="truncate line-clamp-1" title={authorName}>{authorName}</span>
             <span className="text-muted-foreground/70 ml-auto whitespace-nowrap">
                <CalendarDays className="h-3 w-3 inline-block mr-0.5 relative -top-px"/>
                {new Date(createdAt).toLocaleDateString('es-CL', {day:'2-digit', month:'short'})}
            </span>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 mt-auto">
        <Button size="sm" asChild className="w-full text-xs sm:text-sm rounded-md shadow-sm hover:shadow-md transition-shadow">
          <Link href={`/properties/${slug}`} className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Ver Detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
