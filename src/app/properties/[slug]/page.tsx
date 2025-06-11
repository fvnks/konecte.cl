
import { getPropertyBySlugAction } from "@/actions/propertyActions";
import { placeholderUser, type Comment as CommentType, type PropertyListing, type ListingCategory } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BedDouble, Bath, HomeIcon, Tag, ThumbsUp, MessageSquare, Send, UserCircle, AlertTriangle } from "lucide-react";

// Simulación de comentarios, reemplazar con carga desde BD más adelante
const sampleComments: CommentType[] = []; // TODO: Implementar carga de comentarios desde BD

const translatePropertyType = (type: 'rent' | 'sale'): string => {
  if (type === 'rent') return 'En Arriendo';
  if (type === 'sale') return 'En Venta';
  return type;
}

const translateCategory = (category: ListingCategory): string => {
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
    return `${new Intl.NumberFormat('es-CL').format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP' }).format(price);
  } catch (e) {
    // console.warn(`Invalid currency code for formatting: ${currency}. Falling back to simple number format.`);
    return `${new Intl.NumberFormat('es-CL').format(price)} ${currency || 'CLP'}`;
  }
};


export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlugAction(params.slug);

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Propiedad No Encontrada</h1>
        <p className="text-muted-foreground">La propiedad que buscas no existe o no está disponible.</p>
      </div>
    );
  }
  
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/800x450.png?text=Propiedad+Sin+Imagen';


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            className="object-cover"
            priority
            data-ai-hint="interior de propiedad"
          />
           <Badge variant="secondary" className="absolute top-4 left-4 text-sm py-1 px-3 capitalize shadow-md">
            {translatePropertyType(property.propertyType)}
          </Badge>
        </div>
        <CardHeader className="p-6">
          <CardTitle className="text-3xl font-headline">{property.title}</CardTitle>
          <div className="flex items-center text-muted-foreground mt-2">
            <MapPin className="mr-2 h-5 w-5" />
            <span>{property.address}, {property.city}, {property.country}</span>
          </div>
           <div className="mt-2 text-3xl font-bold text-primary">
            {formatPrice(property.price, property.currency)}
            {property.propertyType === 'rent' && <span className="text-lg font-normal text-muted-foreground">/mes</span>}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <BedDouble className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.bedrooms} Dormitorios</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <Bath className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.bathrooms} Baños</p>
            </div>
             <div className="p-3 bg-secondary/50 rounded-lg">
              <HomeIcon className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.areaSqMeters} m²</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <Tag className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium capitalize">{translateCategory(property.category)}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline">Descripción</h3>
            <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
          </div>

          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Características</h3>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 list-inside">
                {property.features.map(feature => (
                  <li key={feature} className="flex items-center text-muted-foreground">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 mr-2 text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {property.author && (
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-2 font-headline">Publicado por</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={property.author.avatarUrl || `https://placehold.co/40x40.png?text=${property.author.name?.charAt(0).toUpperCase()}`} alt={property.author.name} data-ai-hint="persona" />
                  <AvatarFallback>{property.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{property.author.name}</p>
                  {property.createdAt && <p className="text-xs text-muted-foreground">Publicado el {new Date(property.createdAt).toLocaleDateString('es-CL')} </p>}
                </div>
                <Button variant="outline" className="ml-auto">Contactar al Anunciante</Button>
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>

      <Card id="comments">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <MessageSquare className="mr-3 h-7 w-7 text-primary"/> Discusiones ({sampleComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 items-start">
            <Avatar className="mt-1">
              <AvatarImage src={placeholderUser.avatarUrl} />
              <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Textarea placeholder="Añade un comentario público..." className="min-h-[80px]" />
              <Button className="flex items-center gap-2">
                <Send className="h-4 w-4"/> Publicar Comentario
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sampleComments.map(comment => (
              <div key={comment.id} className="flex gap-3 items-start p-4 bg-secondary/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={comment.author?.avatarUrl} alt={comment.author?.name} data-ai-hint="persona" />
                  <AvatarFallback>{comment.author?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.author?.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString('es-CL')}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground hover:text-primary">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {comment.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground">Responder</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
           {sampleComments.length === 0 && <p className="text-muted-foreground text-center py-4">Aún no hay comentarios. ¡Sé el primero en comentar!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
