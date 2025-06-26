// src/components/property/PropertyListItem.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag, DollarSign, CalendarDays, ShieldCheck, Eye, Bot } from 'lucide-react';
import CustomDetailButton from '@/components/ui/CustomDetailButton';
import LikeButton from '@/components/ui/LikeButton';
import AuthorInfoDialog from './AuthorInfoDialog';
import ClientFormattedDate from '@/components/ui/ClientFormattedDate';

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
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)} ${currency || 'CLP'}`;
  }
};

const getRoleDisplayName = (roleId?: string, roleName?: string): string | null => {
  if (roleName) return roleName;
  if (roleId === 'user') return 'Usuario';
  if (roleId === 'broker') return 'Corredor';
  if (roleId === 'admin') return 'Admin';
  return roleId || null;
};

export default function PropertyListItem({ property }: PropertyListItemProps) {
  const {
    id,
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
    commentsCount,
    propertyType,
    totalAreaSqMeters,
    description,
    createdAt,
    pub_id,
    source,
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/320x240.png?text=Propiedad';
  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const authorRoleDisplay = getRoleDisplayName(author?.role_id, author?.role_name);
  const whatsappLink = `https://wa.me/56912345678?text=Hola,%20me%20interesa%20la%20propiedad%20con%20código:%20${pub_id}`;

  const authorDisplay = (
    <div className="flex items-center gap-2 self-start sm:self-center cursor-pointer group/author rounded-md p-1 -ml-1 hover:bg-accent/50 transition-colors">
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border">
          <AvatarImage src={authorAvatar || `https://placehold.co/32x32.png?text=${authorInitials}`} alt={authorName} data-ai-hint="agente inmobiliario" />
          <AvatarFallback className="text-xs bg-muted">{authorInitials}</AvatarFallback>
        </Avatar>
        <div className="text-xs">
          <span className="text-muted-foreground line-clamp-1 group-hover/author:text-primary transition-colors">Por {authorName}</span>
          <div className="flex items-center gap-x-2">
          {authorRoleDisplay && (
            <p className="text-muted-foreground/80 flex items-center capitalize">
              <ShieldCheck className="h-3 w-3 mr-1 text-primary/70"/>
              {authorRoleDisplay}
            </p>
          )}
            {source === 'bot' && (
              <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/80 flex items-center text-primary/80 hover:underline" onClick={(e) => e.stopPropagation()}>
                <Bot className="h-3 w-3 mr-1"/>
                <span>vía Bot</span>
              </Link>
            )}
          </div>
          <p className="text-muted-foreground/70 flex items-center mt-0.5">
            <CalendarDays className="h-3 w-3 mr-1" />
            <ClientFormattedDate date={createdAt} options={{day:'2-digit', month:'short'}} />
          </p>
        </div>
      </div>
  );

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl w-full flex flex-col md:flex-row group border border-border hover:border-primary/30">
      <Link href={`/properties/${slug}`} className="md:w-[240px] lg:w-[280px] xl:w-[320px] block flex-shrink-0 relative">
        <div className="aspect-video md:aspect-[4/3] w-full h-full overflow-hidden md:rounded-l-xl md:rounded-r-none rounded-t-xl">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (min-width: 768px) 240px, (min-width: 1024px) 280px, (min-width: 1280px) 320px"
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint="fachada casa departamento"
          />
          <Badge variant="default" className="absolute top-2.5 left-2.5 capitalize text-xs px-2.5 py-1 shadow-md bg-primary/90 text-primary-foreground rounded-md">
            {translatePropertyTypeBadge(propertyType)}
          </Badge>
          {pub_id && (
            <Badge variant="outline" className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 shadow-md rounded-md bg-black/50 text-white backdrop-blur-sm font-mono">
              {pub_id}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between">
        <div>
          <CardHeader className="p-0 mb-1.5 sm:mb-2">
            <Link href={`/properties/${slug}`} className="block">
              <CardTitle className="text-lg sm:text-xl font-headline leading-tight hover:text-primary transition-colors line-clamp-2">
                {title}
              </CardTitle>
            </Link>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
              <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-primary/80" />
              <span className="truncate">{city}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 mb-2.5 sm:mb-3">
            <div className="text-xl sm:text-2xl font-bold text-accent mb-1.5 flex items-center">
                <DollarSign className="h-5 w-5 mr-1.5 text-accent/90"/>
                {formatPrice(price, currency)}
                {propertyType === 'rent' && <span className="text-sm font-normal text-muted-foreground ml-1.5">/mes</span>}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center"><BedDouble className="mr-1 h-4 w-4 text-primary/80" /> {bedrooms} dorms.</span>
              <span className="flex items-center"><Bath className="mr-1 h-4 w-4 text-primary/80" /> {bathrooms} baños</span>
              <span className="flex items-center"><HomeIcon className="mr-1 h-4 w-4 text-primary/80" /> {totalAreaSqMeters} m²</span>
            </div>
            <Badge variant="secondary" className="capitalize text-xs mt-2.5 px-2 py-0.5 rounded-md">
              <Tag className="mr-1 h-3 w-3" />
              {translateCategoryBadge(category)}
            </Badge>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-2.5 sm:pt-3 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
          {author ? (
            <AuthorInfoDialog author={author}>
                {authorDisplay}
            </AuthorInfoDialog>
          ) : <div />}
          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center w-full sm:w-auto justify-end">
            <LikeButton listingId={id} listingType="property" />
            <Link href={`/properties/${slug}#comments`} aria-label={`${commentsCount} comentarios`} className="flex items-center">
              <Button variant="ghost" size="sm" className="h-9 px-2 py-1 text-xs text-muted-foreground hover:text-primary">
                <MessageCircle className="mr-1 h-4 w-4" />
                <span>{commentsCount}</span>
              </Button>
            </Link>
             <CustomDetailButton href={`/properties/${slug}`}>
                Ver Detalles
            </CustomDetailButton>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
