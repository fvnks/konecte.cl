// src/components/landing/InteractiveAIMatching.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from 'next/link';
// import { Button } from "@/components/ui/button"; // Reemplazado por GenerateAIButton
import GenerateAIButton from '@/components/ui/GenerateAIButton'; // Importar el nuevo botón
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { findListingsForFreeTextSearch, type FindListingsForFreeTextSearchInput, type FindListingsForFreeTextSearchOutput, type FoundMatch } from '@/ai/flows/find-listings-for-free-text-search-flow';
import { recordUserListingInteractionAction } from '@/actions/interactionActions';
import type { User as StoredUser, InteractionTypeEnum, PropertyListing, SearchRequest } from '@/lib/types';
import { useState, useEffect } from "react";
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, SearchIcon, Building, PlusCircle, ThumbsUp, ThumbsDown, UserCircle as UserIconLucide, MessagesSquare, HeartHandshake, X } from "lucide-react";
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button"; // Necesario para el botón de Iniciar Sesión
import EditableText from '@/components/ui/EditableText';
import StaticText from '@/components/ui/StaticText';
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de tu búsqueda debe tener al menos 10 caracteres.").max(1000, "Máximo 1000 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function InteractiveAIMatching() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<FoundMatch[]>([]); 
  const [propertiesToShow, setPropertiesToShow] = useState<FoundMatch[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FindListingsForFreeTextSearchOutput | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage for AI matching:", error);
      }
    }
  }, []);

  const form = useForm<AiMatchingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSearchDescription: "",
    },
  });

  async function onSubmit(values: AiMatchingFormValues) {
    setIsLoading(true);
    setAiSearchResults([]);
    setPropertiesToShow([]);
    setError(null);
    setHasSearched(true);
    setCurrentIndex(0);
    setIsSearching(true);
    try {
      const input: FindListingsForFreeTextSearchInput = {
        userSearchDescription: values.userSearchDescription,
      };
      const result = await findListingsForFreeTextSearch(input);
      setAiSearchResults(result.matches); 
      
      const onlyProperties = result.matches.filter(match => match.type === 'property');
      setPropertiesToShow(onlyProperties);
      setSearchResults(result);

      if (onlyProperties.length > 0) {
        toast({
          title: "Búsqueda IA Completada",
          description: `Se encontraron ${onlyProperties.length} propiedad(es) sugerida(s). ¡Ahora puedes indicar cuáles te gustan!`,
        });
      } else {
        toast({
          title: "Búsqueda IA Completada",
          description: "No se encontraron propiedades que coincidan con tu descripción.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error("Error calling AI free text search flow:", err);
      setError(err.message || "Ocurrió un error al procesar la búsqueda con IA.");
      toast({
        title: "Error de IA",
        description: err.message || "No se pudo obtener una respuesta de la IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }

  const handleInteraction = async (listingId: string, interactionType: InteractionTypeEnum) => {
    if (!loggedInUser) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para interactuar con las propiedades.",
        variant: "default",
        action: <Button variant="link" size="sm" asChild><Link href="/auth/signin">Iniciar Sesión</Link></Button>
      });
      return;
    }
    setIsInteracting(true);
    try {
      const result = await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
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

    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const currentPropertyMatch = propertiesToShow[currentIndex];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ai-search-input" className="text-base font-medium">
          <StaticText id="landing:ai-search-label" textType="span">
            Describe lo que buscas
          </StaticText>
        </Label>
        <div className="relative">
          <Textarea
            id="ai-search-input"
            placeholder={
              isSearching
                ? "Buscando..."
                : "Ej: Busco un departamento de 2 dormitorios en Providencia cerca del metro, con estacionamiento, máximo 400 UF"
            }
            className="min-h-[120px] resize-y pr-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => setSearchQuery("")}
            disabled={!searchQuery || isSearching}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => form.handleSubmit(onSubmit)(form.getValues())}
          disabled={!searchQuery || isSearching}
          className="gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <StaticText id="landing:ai-searching-button" textType="span">
                Buscando...
              </StaticText>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <StaticText id="landing:ai-search-button" textType="span">
                Buscar con IA
              </StaticText>
            </>
          )}
        </Button>
      </div>

      {searchResults && (
        <div className="space-y-6 mt-6 border-t pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              <StaticText id="landing:ai-results-title" textType="span">
                Resultados de la búsqueda
              </StaticText>
            </h3>
            <p className="text-sm text-muted-foreground">
              <StaticText id="landing:ai-results-subtitle" textType="span">
                Hemos encontrado estas propiedades que coinciden con tu búsqueda
              </StaticText>
            </p>
          </div>

          {searchResults.properties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">
                      <Link
                        href={`/properties/${property.slug}`}
                        className="hover:underline"
                      >
                        {property.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm">
                    <p className="text-muted-foreground line-clamp-2">
                      {property.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {property.bedrooms} dormitorios
                      </Badge>
                      <Badge variant="outline">
                        {property.bathrooms} baños
                      </Badge>
                      <Badge variant="outline">
                        {property.totalAreaSqMeters} m²
                      </Badge>
                    </div>
                    <div className="mt-2 font-semibold">
                      {formatCurrency(property.price, property.currency)}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button asChild variant="link" className="px-0">
                      <Link href={`/properties/${property.slug}`}>
                        <StaticText id="landing:ai-view-details" textType="span">
                          Ver detalles
                        </StaticText>
                      </Link>
                    </Button>
                    <Badge className="ml-auto">
                      {property.propertyType === "rent" ? "Arriendo" : "Venta"}
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                <StaticText id="landing:ai-no-results" textType="span">
                  No encontramos propiedades que coincidan con tu búsqueda.
                </StaticText>
              </p>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Button asChild variant="outline">
              <Link href="/properties">
                <StaticText id="landing:ai-view-all-properties" textType="span">
                  Ver todas las propiedades
                </StaticText>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mt-4">
          <p className="font-medium">
            <StaticText id="landing:ai-error-title" textType="span">
              Error al procesar la búsqueda
            </StaticText>
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
