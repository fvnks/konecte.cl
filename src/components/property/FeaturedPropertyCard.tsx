// src/components/property/FeaturedPropertyCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListing, User as StoredUser, InteractionTypeEnum } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, CalendarDays, UserCircle as UserIcon, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { MessageSquareText, Building, MessagesSquare } from 'lucide-react';
import CustomDetailButton from '@/components/ui/CustomDetailButton'; // Importar el nuevo botón

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
                description: `${result.message} Revisa tus mensajes.`,
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
                description: result.message || `Tu preferencia ha sido registrada.`,
                duration: 3000,
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
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full group border border-border hover:border-primary/30">
      <Link href={`/properties/${slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl"> {/* Bordes redondeados solo arriba para la imagen */}
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

        {/* Botones de Like/Dislike */}
        <div className="flex justify-center gap-2.5 mb-3">
            <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-500/70 hover:bg-red-500/10 hover:text-red-700 hover:border-red-600 h-9 w-16 flex-1 rounded-lg shadow-sm"
                onClick={() => handleInteraction('dislike')}
                disabled={!loggedInUser || isInteracting}
                title={!loggedInUser ? "Inicia sesión para interactuar" : "No me gusta"}
            >
                {isInteracting ? <Loader2 className="h-5 w-5 animate-spin"/> : <ThumbsDown className="h-5 w-5" />}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-500/70 hover:bg-green-500/10 hover:text-green-700 hover:border-green-600 h-9 w-16 flex-1 rounded-lg shadow-sm"
                onClick={() => handleInteraction('like')}
                disabled={!loggedInUser || isInteracting}
                title={!loggedInUser ? "Inicia sesión para interactuar" : "Me gusta"}
            >
                 {isInteracting ? <Loader2 className="h-5 w-5 animate-spin"/> : <ThumbsUp className="h-5 w-5" />}
            </Button>
        </div>
         {!loggedInUser && (
            <p className="text-[11px] text-muted-foreground text-center -mt-2 mb-2">
                <Link href="/auth/signin" className="underline hover:text-primary">Inicia sesión</Link> para interactuar.
            </p>
        )}
      </CardContent>
      <CardFooter className="p-4 sm:p-5 pt-0 mt-auto">
        <CustomDetailButton href={`/properties/${slug}`} className="w-full">
          Ver Detalles
        </CustomDetailButton>
      </CardFooter>
    </Card>
  );
}
