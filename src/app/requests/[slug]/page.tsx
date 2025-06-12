
import type { PropertyType, ListingCategory, SearchRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, BedDouble, Bath, DollarSign, Tag, SearchIcon, AlertTriangle } from "lucide-react";
import { getRequestBySlugAction } from "@/actions/requestActions";
import RequestComments from "@/components/comments/RequestComments"; // Import the new component

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

  if (!request) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Solicitud No Encontrada</h1>
            <p className="text-muted-foreground">La solicitud que buscas no existe o no está disponible.</p>
        </div>
    );
  }
  
  const locationCity = request.desiredLocation?.city || 'No especificada';
  const locationNeighborhood = request.desiredLocation?.neighborhood;
  const authorName = request.author?.name || "Usuario Anónimo";
  const authorAvatar = request.author?.avatarUrl;
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="p-6">
           <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={authorAvatar || `https://placehold.co/64x64.png?text=${authorInitials}`} alt={authorName} data-ai-hint="persona" />
                <AvatarFallback className="text-2xl">{authorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{authorName}</p>
                <p className="text-sm text-muted-foreground">Publicado el {new Date(request.createdAt).toLocaleDateString('es-CL')}</p>
              </div>
            </div>
          <CardTitle className="text-3xl font-headline flex items-start">
            <SearchIcon className="mr-3 h-8 w-8 text-primary flex-shrink-0 mt-1"/>
            {request.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline">Detalles de la Búsqueda</h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="whitespace-pre-line leading-relaxed">{request.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t">
                <div className="flex items-start">
                  <MapPin className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Ubicación:</strong> {locationCity} {locationNeighborhood ? `(${locationNeighborhood})` : ''}</span>
                </div>
                {request.desiredCategories && request.desiredCategories.length > 0 && (
                  <div className="flex items-start">
                    <Tag className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Tipo de Propiedad:</strong> {request.desiredCategories.map(translateCategory).join(', ')}</span>
                  </div>
                )}
                {request.desiredPropertyType && request.desiredPropertyType.length > 0 && (
                  <div className="flex items-start">
                    <Tag className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Buscando para:</strong> {request.desiredPropertyType.map(translatePropertyType).join(', ')}</span>
                  </div>
                )}
                {request.minBedrooms !== undefined && (
                  <div className="flex items-start">
                    <BedDouble className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Dormitorios:</strong> {request.minBedrooms}+</span>
                  </div>
                )}
                 {request.minBathrooms !== undefined && (
                  <div className="flex items-start">
                    <Bath className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Baños:</strong> {request.minBathrooms}+</span>
                  </div>
                )}
                {request.budgetMax !== undefined && (
                  <div className="flex items-start">
                    <DollarSign className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Presupuesto Máx.:</strong> ${request.budgetMax.toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
           <div className="mt-4">
            {request.desiredPropertyType && request.desiredPropertyType.map(pt => (
                <Badge key={pt} variant="secondary" className="mr-2 mb-2 text-sm py-1 px-3 capitalize">{translatePropertyType(pt)}</Badge>
            ))}
            {request.desiredCategories && request.desiredCategories.map(cat => (
                <Badge key={cat} variant="outline" className="mr-2 mb-2 text-sm py-1 px-3 capitalize">{translateCategory(cat)}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <RequestComments requestId={request.id} requestSlug={request.slug} />

    </div>
  );
}
