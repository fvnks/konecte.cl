
// src/components/landing/InteractiveAIMatching.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
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
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, SearchIcon, Building, PlusCircle, ThumbsUp, ThumbsDown, UserCircle as UserIconLucide, MessagesSquare, HeartHandshake } from "lucide-react";
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
// RequestCard no se usará directamente aquí ya que solo mostraremos propiedades
// import RequestCard from '@/components/request/RequestCard';

const formSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de tu búsqueda debe tener al menos 10 caracteres.").max(1000, "Máximo 1000 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function InteractiveAIMatching() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<FoundMatch[]>([]); // Raw results from AI
  const [propertiesToShow, setPropertiesToShow] = useState<FoundMatch[]>([]); // Filtered properties
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);


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
    try {
      const input: FindListingsForFreeTextSearchInput = {
        userSearchDescription: values.userSearchDescription,
      };
      const result = await findListingsForFreeTextSearch(input);
      setAiSearchResults(result.matches); // Store all matches
      
      // Filter to show only properties
      const onlyProperties = result.matches.filter(match => match.type === 'property');
      setPropertiesToShow(onlyProperties);

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
        if (result.matchDetails?.matchFound) {
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

    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const currentPropertyMatch = propertiesToShow[currentIndex];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userSearchDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-medium">Describe la propiedad que buscas:</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Busco un departamento para arriendo en la V Región, mínimo 2 dormitorios, que acepte mascotas y tenga buena conexión a internet. Presupuesto máximo $700.000..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full sm:w-auto text-base py-2.5 h-auto" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Buscando con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Buscar Propiedades con IA
              </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Analizando y buscando propiedades en la plataforma...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error al Procesar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {hasSearched && !isLoading && !error && (
        <div className="mt-6">
          {currentPropertyMatch ? (
            <Card className="bg-card p-4 rounded-xl border flex flex-col shadow-lg items-center max-w-md mx-auto">
                <div className="w-full flex justify-between items-start mb-2">
                    <Badge variant={'default'} className="capitalize text-xs">
                    <Building className="mr-1.5 h-3.5 w-3.5"/>
                    Propiedad Sugerida ({currentIndex + 1} de {propertiesToShow.length})
                    </Badge>
                    <div className="text-right">
                    <span className="text-lg font-bold text-accent">
                        {(currentPropertyMatch.matchScore * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-muted-foreground -mt-1">Coincidencia</p>
                    </div>
                </div>
                <Progress value={currentPropertyMatch.matchScore * 100} className="w-full h-1.5 [&>div]:bg-accent mb-3" />
                
                <FeaturedPropertyCard property={currentPropertyMatch.item as PropertyListing} />
                
                <div className="mt-3 pt-3 border-t border-dashed w-full">
                    <h4 className="text-xs font-semibold flex items-center mb-1 text-muted-foreground">
                    <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
                    IA Dice:
                    </h4>
                    <p className="text-xs text-muted-foreground/80 bg-secondary/30 p-2 rounded-md whitespace-pre-line italic max-h-20 overflow-y-auto">
                    {currentPropertyMatch.reason}
                    </p>
                </div>
                <div className="flex justify-around w-full mt-4 pt-4 border-t">
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 h-12 w-28"
                        onClick={() => handleInteraction(currentPropertyMatch.item.id, 'dislike')}
                        disabled={!loggedInUser || isInteracting}
                        title={!loggedInUser ? "Inicia sesión para interactuar" : "No me gusta"}
                    >
                        {isInteracting ? <Loader2 className="h-6 w-6 animate-spin"/> : <ThumbsDown className="h-6 w-6" />}
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-green-500 border-green-500 hover:bg-green-50 hover:text-green-600 h-12 w-28"
                        onClick={() => handleInteraction(currentPropertyMatch.item.id, 'like')}
                        disabled={!loggedInUser || isInteracting}
                        title={!loggedInUser ? "Inicia sesión para interactuar" : "Me gusta"}
                    >
                         {isInteracting ? <Loader2 className="h-6 w-6 animate-spin"/> : <ThumbsUp className="h-6 w-6" />}
                    </Button>
                </div>
                {!loggedInUser && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                        <UserIconLucide className="inline-block h-3 w-3 mr-1 align-text-bottom" />
                        <Link href="/auth/signin" className="underline hover:text-primary">Inicia sesión</Link> para guardar tus preferencias.
                    </p>
                )}
            </Card>
          ) : (
            <CardContent className="px-0 pt-4 text-center">
              <HeartHandshake className="mx-auto h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {propertiesToShow.length > 0 && currentIndex >= propertiesToShow.length 
                  ? "¡Has revisado todas las sugerencias!" 
                  : "No encontramos propiedades para tu búsqueda."}
              </h3>
              <p className="text-muted-foreground text-base mb-4">
                {propertiesToShow.length > 0 && currentIndex >= propertiesToShow.length 
                  ? "Esperamos que hayas encontrado algo interesante. Puedes refinar tu búsqueda o publicarla." 
                  : "Intenta ser más específico o publica tu búsqueda para que otros te encuentren."}
              </p>
              <Button asChild variant="default" size="lg">
                <Link href="/requests/submit">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Publicar Mi Búsqueda
                </Link>
              </Button>
            </CardContent>
          )}
        </div>
      )}
    </div>
  );
}
