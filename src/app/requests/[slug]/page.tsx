import { sampleRequests, placeholderUser, Comment as CommentType, PropertyType, ListingCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BedDouble, Bath, DollarSign, Tag, ThumbsUp, MessageSquare, Send, UserCircle, SearchIcon } from "lucide-react";
import Link from "next/link";

async function getRequestData(slug: string) {
  return sampleRequests.find(p => p.slug === slug) || sampleRequests[0];
}

const sampleComments: CommentType[] = [
  { id: 'comment1', content: '¡Podría tener un lugar que se ajuste a tus criterios! Te envío un MD.', author: placeholderUser, createdAt: new Date(Date.now() - 86400000 * 0.3).toISOString(), upvotes: 3 },
];

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
  const request = await getRequestData(params.slug);

  if (!request) {
    return <div className="text-center py-10">Solicitud no encontrada.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader className="p-6">
           <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={request.author.avatarUrl} alt={request.author.name} />
                <AvatarFallback className="text-2xl">{request.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{request.author.name}</p>
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
                  <span><strong>Ubicación:</strong> {request.desiredLocation.city} {request.desiredLocation.neighborhood ? `(${request.desiredLocation.neighborhood})` : ''}</span>
                </div>
                {request.desiredCategories.length > 0 && (
                  <div className="flex items-start">
                    <Tag className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Tipo de Propiedad:</strong> {request.desiredCategories.map(translateCategory).join(', ')}</span>
                  </div>
                )}
                {request.desiredPropertyType.length > 0 && (
                  <div className="flex items-start">
                    <Tag className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Buscando para:</strong> {request.desiredPropertyType.map(translatePropertyType).join(', ')}</span>
                  </div>
                )}
                {request.minBedrooms && (
                  <div className="flex items-start">
                    <BedDouble className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Dormitorios:</strong> {request.minBedrooms}+</span>
                  </div>
                )}
                 {request.minBathrooms && (
                  <div className="flex items-start">
                    <Bath className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Baños:</strong> {request.minBathrooms}+</span>
                  </div>
                )}
                {request.budgetMax && (
                  <div className="flex items-start">
                    <DollarSign className="mr-2 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Presupuesto Máx.:</strong> ${request.budgetMax.toLocaleString('es-CL')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
           <div className="mt-4">
            {request.desiredPropertyType.map(pt => (
                <Badge key={pt} variant="secondary" className="mr-2 mb-2 text-sm py-1 px-3 capitalize">{translatePropertyType(pt)}</Badge>
            ))}
            {request.desiredCategories.map(cat => (
                <Badge key={cat} variant="outline" className="mr-2 mb-2 text-sm py-1 px-3 capitalize">{translateCategory(cat)}</Badge>
            ))}
          </div>
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
              <Textarea placeholder="Añade un comentario público o sugerencia..." className="min-h-[80px]" />
              <Button className="flex items-center gap-2">
                <Send className="h-4 w-4"/> Publicar Comentario
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sampleComments.map(comment => (
              <div key={comment.id} className="flex gap-3 items-start p-4 bg-secondary/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString('es-CL')}</span>
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
          {sampleComments.length === 0 && <p className="text-muted-foreground text-center py-4">Aún no hay comentarios. ¡Sé el primero en comentar o hacer una sugerencia!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
