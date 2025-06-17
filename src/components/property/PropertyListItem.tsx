// src/components/property/PropertyListItem.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, ListingCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag, DollarSign, CalendarDays } from 'lucide-react'; // Added CalendarDays
import CustomDetailButton from '@/components/ui/CustomDetailButton'; // Importar el nuevo botón

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
    createdAt,
  } = property;

  const mainImage = images && images.length > 0 ? images[0] : 'https://placehold.co/320x240.png?text=Propiedad';
  const authorName = author?.name || "Anunciante";
  const authorAvatar = author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

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
              <span className="flex items-center"><HomeIcon className="mr-1 h-4 w-4 text-primary/80" /> {areaSqMeters} m²</span>
            </div>
            <Badge variant="secondary" className="capitalize text-xs mt-2.5 px-2 py-0.5 rounded-md">
              <Tag className="mr-1 h-3 w-3" />
              {translateCategoryBadge(category)}
            </Badge>
          </CardContent>
        </div>
        <CardFooter className="p-0 pt-2.5 sm:pt-3 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border">
              <AvatarImage src={authorAvatar || `https://placehold.co/32x32.png?text=${authorInitials}`} alt={authorName} data-ai-hint="agente inmobiliario" />
              <AvatarFallback className="text-xs bg-muted">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="text-muted-foreground line-clamp-1">Por {authorName}</span>
              <p className="text-muted-foreground/70 flex items-center">
                <CalendarDays className="h-3 w-3 mr-1" />
                {new Date(createdAt).toLocaleDateString('es-CL', {day:'2-digit', month:'short'})}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-center w-full sm:w-auto justify-end">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary p-1 h-auto text-xs">
              <ArrowBigUp className="mr-0.5 h-3.5 w-3.5" />
              <span>{upvotes}</span>
            </Button>
            <Link href={`/properties/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
              <Button variant="ghost" size="sm" className="p-1 h-auto text-xs">
                <MessageCircle className="mr-0.5 h-3.5 w-3.5" />
                <span>{commentsCount}</span>
              </Button>
            </Link>
             <CustomDetailButton href={`/properties/${slug}`} className="self-stretch sm:self-center">
                Ver Detalles
            </CustomDetailButton>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
