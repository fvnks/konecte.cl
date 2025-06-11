import Link from 'next/link';
import Image from 'next/image';
import { PropertyListing } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowBigUp, MessageCircle, MapPin, BedDouble, Bath, HomeIcon, Tag } from 'lucide-react';

interface PropertyCardProps {
  property: PropertyListing;
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
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <Link href={`/properties/${slug}`} className="block group">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={images[0] || 'https://placehold.co/600x400.png'}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="apartment building"
          />
          <Badge variant="secondary" className="absolute top-2 left-2 capitalize">
            {propertyType}
          </Badge>
        </div>
      </Link>
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
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(price)}
          {propertyType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <BedDouble className="mr-1.5 h-4 w-4" /> {bedrooms} beds
          </div>
          <div className="flex items-center">
            <Bath className="mr-1.5 h-4 w-4" /> {bathrooms} baths
          </div>
          <div className="flex items-center">
            <HomeIcon className="mr-1.5 h-4 w-4" /> {property.areaSqMeters} m²
          </div>
        </div>
        <Badge variant="outline" className="capitalize text-xs">
          <Tag className="mr-1 h-3 w-3" />
          {category}
        </Badge>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t mt-auto">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.avatarUrl} alt={author.name} />
            <AvatarFallback>{author.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">by {author.name}</span>
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
    </Card>
  );
}
