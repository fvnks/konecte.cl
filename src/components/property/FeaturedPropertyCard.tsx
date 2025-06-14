// src/components/property/FeaturedPropertyCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, User as StoredUser, InteractionTypeEnum } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, DollarSign, CalendarDays, UserCircle as UserIcon, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

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
    id: propertyId, // Renombrar id a propertyId para claridad
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

  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage for FeaturedPropertyCard:", error);
      }
    }
  }, []);

  const handleInteraction = async (interactionType: InteractionTypeEnum) => {
    if (!loggedInUser) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para interactuar.",
        variant: "default",
        action: <Button variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
      });
      return;
    }
    setIsInteracting(true);
    try {
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId: propertyId,
        listingType: 'property',
        interactionType,
      });

      if (result.success) {
        if (result.matchDetails?.matchFound && result.matchDetails.conversationId) {
            toast({
                title: "¡Es un Match Mutuo!",
                description: `Se ha iniciado una conversación con ${result.matchDetails.userBName} sobre "${result.matchDetails.likedListingTitle}" y "${result.matchDetails.reciprocalListingTitle}".`,
                duration: 7000,
                action: (
                    <Button variant="link" size="sm" asChild>
                        <Link href={`/dashboard/messages/${result.matchDetails.conversationId}`}>
                            Ver Chat
                        </Link>
                    </Button>
                )
            });
            window.dispatchEvent(new CustomEvent('messagesUpdated'));
        } else {
            toast({
                title: "Preferencia Guardada",
                description: `Tu preferencia (${interactionType === 'like' ? 'Me gusta' : 'No me gusta'}) ha sido registrada.`,
                duration: 2000,
            });
        }
      } else {
         toast({
            title: "Error",
            description: result.message || `No se pudo guardar tu preferencia.`,
            variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: `No se pudo guardar tu preferencia: ${error.message}`,
        variant: "destructive",
      });
    } finally {
       setIsInteracting(false);
    }
  };


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
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
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

        {/* Botones de Like/Dislike */}
        <div className="flex justify-center gap-2 mb-3">
            <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-400 hover:bg-red-50 hover:text-red-600 h-8 w-16 flex-1"
                onClick={() => handleInteraction('dislike')}
                disabled={!loggedInUser || isInteracting}
                title={!loggedInUser ? "Inicia sesión para interactuar" : "No me gusta"}
            >
                {isInteracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <ThumbsDown className="h-4 w-4" />}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="text-green-500 border-green-400 hover:bg-green-50 hover:text-green-600 h-8 w-16 flex-1"
                onClick={() => handleInteraction('like')}
                disabled={!loggedInUser || isInteracting}
                title={!loggedInUser ? "Inicia sesión para interactuar" : "Me gusta"}
            >
                {isInteracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <ThumbsUp className="h-4 w-4" />}
            </Button>
        </div>
         {!loggedInUser && (
            <p className="text-[10px] text-muted-foreground text-center -mt-2 mb-2">
                <Link href="/auth/signin" className="underline hover:text-primary">Inicia sesión</Link> para interactuar.
            </p>
        )}
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
