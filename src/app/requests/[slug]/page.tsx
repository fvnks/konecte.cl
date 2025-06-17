
import type { PropertyType, ListingCategory, SearchRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, BedDouble, Bath, DollarSign, Tag, SearchCheck as SearchIcon, AlertTriangle, CalendarDays, Building, Handshake, Share2 } from "lucide-react";
import { getRequestBySlugAction } from "@/actions/requestActions";
import RequestComments from "@/components/comments/RequestComments"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SocialShareButtons from '@/components/ui/SocialShareButtons';
import { headers } from 'next/headers';

const translatePropertyType = (type: PropertyType): string => {
  if (type === 'rent') return 'Arriendo';
  if (type === 'sale') return 'Venta';
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

export default async function RequestDetailPage({ params }: { params: { slug: string } }) {
  const request = await getRequestBySlugAction(params.slug);

  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const sharingUrl = request ? `${protocol}://${host}/requests/${request.slug}` : '';

  if (!request) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <AlertTriangle className="h-20 w-20 text-destructive mb-6" />
            <h1 className="text-3xl font-bold mb-3">Solicitud No Encontrada</h1>
            <p className="text-lg text-muted-foreground mb-8">La solicitud que buscas no existe o ya no está disponible.</p>
            <Button asChild>
              <Link href="/requests">Volver a Solicitudes</Link>
            </Button>
        </div>
    );
  }
  
  const locationCity = request.desiredLocation?.city || 'No especificada';
  const locationNeighborhood = request.desiredLocation?.neighborhood;
  const authorName = request.author?.name || "Usuario Anónimo";
  const authorAvatar = request.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();


  return (
    <div className="max-w-4xl mx-auto space-y-8 lg:space-y-10">
      <Card className="shadow-xl rounded-xl">
        <CardHeader className="p-6 md:p-8">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={authorAvatar || `https://placehold.co/80x80.png?text=${authorInitials}`} alt={authorName} data-ai-hint="usuario buscando"/>
                    <AvatarFallback className="text-2xl">{authorInitials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-xl sm:text-2xl font-semibold">{authorName}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <CalendarDays className="h-4 w-4 mr-1.5"/>
                        Publicado el {new Date(request.createdAt).toLocaleDateString('es-CL')}
                    </p>
                </div>
                </div>
                {request.open_for_broker_collaboration && (
                    <Badge variant="outline" className="text-sm py-1.5 px-3 border-purple-500 text-purple-600 self-start sm:self-center">
                        <Handshake className="h-4 w-4 mr-2" /> Abierta a Colaboración
                    </Badge>
                )}
            </div>
          <CardTitle className="text-3xl lg:text-4xl font-headline font-bold flex items-start">
            <SearchIcon className="mr-3 h-8 w-8 text-primary flex-shrink-0 mt-1"/>
            {request.title}
          </CardTitle>
          <div className="flex justify-between items-center mt-3">
            <CardDescription className="text-base lg:text-lg text-muted-foreground leading-relaxed flex-grow pr-4">
                {request.description}
            </CardDescription>
            <SocialShareButtons sharingUrl={sharingUrl} sharingTitle={request.title} />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0 space-y-6">
          <div>
            <h3 className="text-xl lg:text-2xl font-semibold mb-4 font-headline">Detalles de la Búsqueda</h3>
            <div className="space-y-3 text-muted-foreground text-base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t">
                <div className="flex items-start">
                  <MapPin className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Ubicación Deseada:</span><br/>
                    {locationCity} {locationNeighborhood ? `(${locationNeighborhood})` : ''}
                  </div>
                </div>
                {request.desiredPropertyType && request.desiredPropertyType.length > 0 && (
                  <div className="flex items-start">
                    <Tag className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                     <div>
                        <span className="font-medium text-foreground">Buscando para:</span><br/>
                        {request.desiredPropertyType.map(translatePropertyType).join(', ')}
                    </div>
                  </div>
                )}
                 {request.desiredCategories && request.desiredCategories.length > 0 && (
                  <div className="flex items-start col-span-1 sm:col-span-2">
                    <Building className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-foreground">Tipos de Propiedad:</span><br/>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                        {request.desiredCategories.map(cat => (
                            <Badge key={cat} variant="secondary" className="text-sm py-1 px-2.5 capitalize rounded-md">{translateCategory(cat)}</Badge>
                        ))}
                        </div>
                    </div>
                  </div>
                )}
                {request.minBedrooms !== undefined && (
                  <div className="flex items-start">
                    <BedDouble className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-foreground">Dormitorios:</span><br/> {request.minBedrooms}+
                    </div>
                  </div>
                )}
                 {request.minBathrooms !== undefined && (
                  <div className="flex items-start">
                    <Bath className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="font-medium text-foreground">Baños:</span><br/> {request.minBathrooms}+
                    </div>
                  </div>
                )}
                {request.budgetMax !== undefined && (
                  <div className="flex items-start">
                    <DollarSign className="mr-2.5 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                     <div>
                        <span className="font-medium text-foreground">Presupuesto Máx.:</span><br/> ${request.budgetMax.toLocaleString('es-CL')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RequestComments requestId={request.id} requestSlug={request.slug} />

    </div>
  );
}
