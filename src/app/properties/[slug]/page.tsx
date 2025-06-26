import { getPropertyBySlugAction } from "@/actions/propertyActions";
import type { PropertyListing, ListingCategory, User as StoredUserType, OrientationType } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, BedDouble, Bath, HomeIcon as PropertyAreaIcon, Tag, AlertTriangle, UserCircle, DollarSign, ParkingCircle, Trees, CheckSquare, MessageSquare, CalendarDays, ShieldCheck, Eye, CalendarPlus, Share2, Compass, Dog, Sofa, Building as CommercialIcon, Warehouse, Car } from "lucide-react";
import PropertyComments from "@/components/comments/PropertyComments"; 
import Link from "next/link";
import RecordView from '@/components/lead-tracking/RecordView';
import PropertyInquiryForm from "@/components/property/PropertyInquiryForm";
import SocialShareButtons from '@/components/ui/SocialShareButtons'; 
import { headers } from 'next/headers'; 
import PropertyAuthorContactInfoClient from "@/components/property/PropertyAuthorContactInfoClient";

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

const orientationLabels: Record<OrientationType, string> = {
  north: "Norte",
  south: "Sur",
  east: "Este",
  west: "Oeste",
  northeast: "Nororiente",
  northwest: "Norponiente",
  southeast: "Suroriente",
  southwest: "Surponiente",
  other: "Otra",
  none: "No especificada",
};


export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlugAction(params.slug);

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const sharingUrl = property ? `${protocol}://${host}/properties/${property.slug}` : '';


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

  const featureIcons: Record<string, React.ElementType> = {
    "Estacionamiento": ParkingCircle,
    "Piscina": Trees, 
    "Bodega": Warehouse, // Corrected
    "Gimnasio": CheckSquare, 
    "Mascotas": Dog,
    "Amoblado": Sofa,
    "Comercial": CommercialIcon,
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
            <div className="flex justify-between items-start gap-6">
              <div className="flex-grow">
                <CardTitle className="text-3xl lg:text-4xl font-headline font-bold">{property.title}</CardTitle>
                <div className="flex items-center text-muted-foreground mt-2 text-base">
                  <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
                  <span>{property.address}, {property.city}, {property.country}</span>
                </div>
                <div className="mt-4 text-3xl lg:text-4xl font-bold text-primary">
                  {formatPrice(property.price, property.currency)}
                  {property.propertyType === 'rent' && <span className="text-lg font-normal text-muted-foreground ml-2">/mes</span>}
                </div>
              </div>

              {property.pub_id && (
                <div className="flex-shrink-0">
                  <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-slate-50 text-center h-full">
                    <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Código</span>
                    <p className="text-xl font-mono font-bold text-slate-800 mt-1">
                      {property.pub_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center mt-6 border-t pt-6">
              {[
                { icon: BedDouble, label: `${property.bedrooms} Dorms` },
                { icon: Bath, label: `${property.bathrooms} Baños` },
                { icon: PropertyAreaIcon, label: `${property.totalAreaSqMeters} m² Tot.`, tooltip: "Superficie Total" },
                { icon: PropertyAreaIcon, label: `${property.usefulAreaSqMeters || 'N/A'} m² Útil`, tooltip: "Superficie Útil", condition: property.usefulAreaSqMeters !== null && property.usefulAreaSqMeters !== undefined },
                { icon: Car, label: `${property.parkingSpaces || 0} Estc.`, tooltip: "Estacionamientos" },
                { icon: Tag, label: translateCategory(property.category), capitalize: true, tooltip: "Categoría" },
                { icon: Compass, label: property.orientation ? orientationLabels[property.orientation] : 'N/A', tooltip: "Orientación", condition: property.orientation && property.orientation !== 'none'},
              ].filter(item => item.condition !== false).map(item => (
                <div key={item.label} className="p-3 bg-secondary/50 rounded-lg text-sm sm:text-base" title={item.tooltip}>
                  <item.icon className="mx-auto mb-1.5 h-6 w-6 text-primary" />
                  <p className={`font-medium ${item.capitalize ? 'capitalize' : ''}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 space-y-6"> 
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl lg:text-2xl font-semibold font-headline">Descripción de la Propiedad</h3>
                <SocialShareButtons sharingUrl={sharingUrl} sharingTitle={property.title} />
              </div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base">{property.description}</p>
            </div>

            {property.features && property.features.length > 0 && (
              <div>
                <h3 className="text-xl lg:text-2xl font-semibold mb-3 font-headline">Características Principales</h3>
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

             <div className="space-y-3">
                <h3 className="text-xl lg:text-2xl font-semibold font-headline">Otras Características</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.petsAllowed && (<div className="flex items-center text-sm text-muted-foreground p-2 bg-secondary/30 rounded-md"><Dog className="h-5 w-5 mr-2 text-primary"/>Se aceptan mascotas</div>)}
                    {property.furnished && (<div className="flex items-center text-sm text-muted-foreground p-2 bg-secondary/30 rounded-md"><Sofa className="h-5 w-5 mr-2 text-primary"/>Amoblado</div>)}
                    {property.commercialUseAllowed && (<div className="flex items-center text-sm text-muted-foreground p-2 bg-secondary/30 rounded-md"><CommercialIcon className="h-5 w-5 mr-2 text-primary"/>Permite uso comercial</div>)}
                    {property.hasStorage && (<div className="flex items-center text-sm text-muted-foreground p-2 bg-secondary/30 rounded-md"><Warehouse className="h-5 w-5 mr-2 text-primary"/>Tiene bodega</div>)}
                </div>
                {(!property.petsAllowed && !property.furnished && !property.commercialUseAllowed && !property.hasStorage) && (
                    <p className="text-sm text-muted-foreground italic">No se especificaron otras características.</p>
                )}
            </div>
            
            {property.author && (
              <PropertyAuthorContactInfoClient 
                author={property.author} 
                contactEmail={property.author.email} 
                contactPhone={property.author.phone_number}
                propertyId={property.id}
                propertyTitle={property.title}
              />
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
