
import { getPropertyBySlugAction } from "@/actions/propertyActions";
import type { PropertyListing, ListingCategory, User as StoredUserType } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, BedDouble, Bath, HomeIcon as PropertyAreaIcon, Tag, AlertTriangle, UserCircle, DollarSign, ParkingCircle, Trees, CheckSquare, MessageSquare, CalendarDays, Eye } from "lucide-react";
import PropertyComments from "@/components/comments/PropertyComments"; 
import Link from "next/link";
import RecordView from '@/components/lead-tracking/RecordView';
import PropertyInquiryForm from "@/components/property/PropertyInquiryForm";

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
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)} UF`;
  }
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch (e) {
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)} ${currency || 'CLP'}`;
  }
};

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlugAction(params.slug);

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertTriangle className="h-20 w-20 text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-3">Propiedad No Encontrada</h1>
        <p className="text-lg text-muted-foreground mb-8">La propiedad que buscas no existe o ya no está disponible.</p>
        <Button asChild>
          <Link href="/properties">Volver a Propiedades</Link>
        </Button>
      </div>
    );
  }
  
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/1200x675.png?text=Propiedad+Sin+Imagen';
  const authorName = property.author?.name || "Anunciante";
  const authorAvatar = property.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const featureIcons: Record<string, React.ElementType> = {
    "Estacionamiento": ParkingCircle,
    "Piscina": Trees, 
    "Bodega": PropertyAreaIcon, 
    "Gimnasio": CheckSquare, 
  };


  return (
    <>
      <RecordView propertyId={property.id} />
      <div className="max-w-5xl mx-auto space-y-8 lg:space-y-10">
        <Card className="overflow-hidden shadow-xl rounded-xl">
          <div className="relative aspect-video w-full">
            <Image
              src={mainImage}
              alt={property.title}
              fill
              className="object-cover"
              priority
              data-ai-hint="interior de casa departamento"
            />
            <Badge variant="default" className="absolute top-4 left-4 text-sm py-1.5 px-3 capitalize shadow-md bg-primary/90 text-primary-foreground rounded-md">
              {translatePropertyType(property.propertyType)}
            </Badge>
          </div>
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-3xl lg:text-4xl font-headline font-bold">{property.title}</CardTitle>
            <div className="flex items-center text-muted-foreground mt-2 text-base">
              <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
              <span>{property.address}, {property.city}, {property.country}</span>
            </div>
            <div className="mt-3 text-3xl lg:text-4xl font-bold text-primary">
              {formatPrice(property.price, property.currency)}
              {property.propertyType === 'rent' && <span className="text-lg font-normal text-muted-foreground">/mes</span>}
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
              {[
                { icon: BedDouble, label: `${property.bedrooms} Dorms` },
                { icon: Bath, label: `${property.bathrooms} Baños` },
                { icon: PropertyAreaIcon, label: `${property.areaSqMeters} m²` },
                { icon: Tag, label: translateCategory(property.category), capitalize: true },
              ].map(item => (
                <div key={item.label} className="p-3 bg-secondary/50 rounded-lg text-sm sm:text-base">
                  <item.icon className="mx-auto mb-1.5 h-6 w-6 text-primary" />
                  <p className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.label}</p>
                </div>
              ))}
            </div>
            
            <div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-3 font-headline">Descripción de la Propiedad</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base">{property.description}</p>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h3 className="text-xl lg:text-2xl font-semibold mb-3 font-headline">Características Destacadas</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features.map(feature => {
                    const FeatureIcon = featureIcons[feature] || CheckSquare;
                    return (
                    <li key={feature} className="flex items-center text-muted-foreground bg-secondary/30 p-3 rounded-md text-sm">
                      <FeatureIcon className="h-5 w-5 mr-2.5 text-primary flex-shrink-0"/>
                      {feature}
                    </li>
                  )})}
                </ul>
              </div>
            )}

            {property.author && (
              <div className="border-t pt-6 mt-8">
                <h3 className="text-xl lg:text-2xl font-semibold mb-3 font-headline">Información del Anunciante</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-secondary/30 p-4 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="agente inmobiliario"/>
                    <AvatarFallback className="text-xl">{authorInitials || <UserCircle className="h-8 w-8"/>}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold text-lg">{authorName}</p>
                    {property.author.created_at && <p className="text-sm text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-1.5"/>Miembro desde {new Date(property.author.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">Propiedad publicada el {new Date(property.createdAt).toLocaleDateString('es-CL')} </p>
                  </div>
                  {/* El botón de contacto se reemplazará por el formulario de consulta */}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PropertyInquiryForm 
          propertyId={property.id} 
          propertyOwnerId={property.user_id} 
          propertyTitle={property.title}
        />

        <PropertyComments propertyId={property.id} propertySlug={property.slug} />

      </div>
    </>
  );
}
