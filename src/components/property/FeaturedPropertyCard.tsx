
// src/components/property/FeaturedPropertyCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, CalendarDays, UserCircle as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CustomDetailButton from '@/components/ui/CustomDetailButton';
import LikeButton from '@/components/ui/LikeButton';

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
    id: propertyId,
    title,
    slug,
    images,
    price,
    currency,
    city,
    propertyType,
    author,
    createdAt,
    // upvotes, // REMOVED - LikeButton will fetch its own state
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/300x200.png?text=Propiedad';
  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full group border border-border hover:border-primary/30">
      <Link href={`/properties/${slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint="fachada propiedad compacta"
          />
          <Badge variant="default" className="absolute top-3 left-3 capitalize text-xs px-2.5 py-1 shadow-md bg-primary/90 text-primary-foreground rounded-md">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
        </div>
      </Link>
      <CardHeader className="p-4 sm:p-5 flex-grow">
        <Link href={`/properties/${slug}`} className="block">
          <CardTitle className="text-base sm:text-lg font-headline leading-snug hover:text-primary transition-colors line-clamp-2 h-[48px] sm:h-[56px]">
            {title}
          </CardTitle>
        </Link>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1.5">
          <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-primary/80" />
          <span className="truncate">{city}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
         <div className="text-lg sm:text-xl font-bold text-accent mb-2.5 flex items-center">
          <DollarSign className="h-5 w-5 mr-1.5 text-accent/90" />
          {formatPriceCompact(price, currency)}
          {propertyType === 'rent' && <span className="text-xs font-normal text-muted-foreground ml-1.5">/mes</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3.5">
            <Avatar className="h-7 w-7">
              <AvatarImage src={authorAvatar || `https://placehold.co/28x28.png?text=${authorInitials}`} alt={authorName} data-ai-hint="agente inmobiliario"/>
              <AvatarFallback className="text-[10px] bg-muted">{authorInitials || <UserIcon className="h-3.5 w-3.5"/>}</AvatarFallback>
            </Avatar>
            <span className="truncate line-clamp-1" title={authorName}>{authorName}</span>
             <span className="text-muted-foreground/80 ml-auto whitespace-nowrap flex items-center">
                <CalendarDays className="h-3.5 w-3.5 inline-block mr-1"/>
                {new Date(createdAt).toLocaleDateString('es-CL', {day:'2-digit', month:'short'})}
            </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-5 pt-0 mt-auto flex flex-col items-center">
        <LikeButton listingId={propertyId} listingType="property" className="mb-[10px]" />
        <CustomDetailButton href={`/properties/${slug}`}>
          Ver Detalles
        </CustomDetailButton>
      </CardFooter>
    </Card>
  );
}


    