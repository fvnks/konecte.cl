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
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, SearchIcon, Building, PlusCircle, ThumbsUp, ThumbsDown, UserCircle as UserIconLucide, MessagesSquare, HeartHandshake } from "lucide-react";
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button"; // Necesario para el botón de Iniciar Sesión
import EditableText from '@/components/ui/EditableText';

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
      setAiSearchResults(result.matches); 
      
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userSearchDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-medium">
                  <EditableText id="landing:ai-search-label" textType="span">
                    Describe la propiedad que buscas:
                  </EditableText>
                </FormLabel>
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
          <div className="text-center">
            <GenerateAIButton type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              <EditableText id="landing:ai-search-button" textType="span">
                Buscar Propiedades con IA
              </EditableText>
            </GenerateAIButton>
          </div>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">
            <EditableText id="landing:ai-search-loading" textType="span">
              Analizando y buscando propiedades en la plataforma...
            </EditableText>
          </p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <EditableText id="landing:ai-search-error-title" textType="span">
                Error al Procesar
              </EditableText>
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
                    <EditableText id="landing:ai-search-property-suggested" textType="span">
                      Propiedad Sugerida
                    </EditableText> ({currentIndex + 1} de {propertiesToShow.length})
                    </Badge>
                    <div className="text-right">
                    <span className="text-lg font-bold text-accent">
                        {(currentPropertyMatch.matchScore * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-muted-foreground -mt-1">
                      <EditableText id="landing:ai-search-match" textType="span">
                        Coincidencia
                      </EditableText>
                    </p>
                    </div>
                </div>
                <Progress value={currentPropertyMatch.matchScore * 100} className="w-full h-1.5 [&>div]:bg-accent mb-3" />
                
                <FeaturedPropertyCard property={currentPropertyMatch.item as PropertyListing} />
                
                <div className="mt-3 pt-3 border-t border-dashed w-full">
                    <h4 className="text-xs font-semibold flex items-center mb-1 text-muted-foreground">
                    <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
                    <EditableText id="landing:ai-search-ia-says" textType="span">
                      IA Dice:
                    </EditableText>
                    </h4>
                    <p className="text-xs text-muted-foreground/80 bg-secondary/30 p-2 rounded-md whitespace-pre-line italic max-h-20 overflow-y-auto">
                    {currentPropertyMatch.reason}
                    </p>
                </div>
                
                <div className="flex gap-2 mt-4 w-full">
                    <Button 
                        onClick={() => handleInteraction(currentPropertyMatch.item.id, 'like')} 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={isInteracting}
                    >
                        <ThumbsUp className="mr-1.5 h-4 w-4" />
                        <EditableText id="landing:ai-search-like-button" textType="span">
                          Me Gusta
                        </EditableText>
                    </Button>
                    <Button 
                        onClick={() => handleInteraction(currentPropertyMatch.item.id, 'dislike')} 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        disabled={isInteracting}
                    >
                        <ThumbsDown className="mr-1.5 h-4 w-4" />
                        <EditableText id="landing:ai-search-dislike-button" textType="span">
                          No Me Gusta
                        </EditableText>
                    </Button>
                    <Button 
                        onClick={() => setCurrentIndex(prevIndex => prevIndex + 1)} 
                        className="flex-1"
                        variant="outline"
                        disabled={isInteracting}
                    >
                        <EditableText id="landing:ai-search-skip-button" textType="span">
                          Omitir
                        </EditableText>
                    </Button>
                </div>
            </Card>
          ) : (
            aiSearchResults.length > 0 ? (
              <Card className="bg-card p-6 rounded-xl border shadow-lg text-center">
                <div className="mb-4">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="text-xl font-bold">
                    <EditableText id="landing:ai-search-complete-title" textType="span">
                      ¡Búsqueda Completada!
                    </EditableText>
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  <EditableText id="landing:ai-search-complete-description" textType="span">
                    Has visto todas las propiedades sugeridas. ¿Quieres buscar algo más?
                  </EditableText>
                </p>
                <Button onClick={() => {
                  form.reset();
                  setHasSearched(false);
                  setAiSearchResults([]);
                  setPropertiesToShow([]);
                  setCurrentIndex(0);
                }} variant="outline" className="w-full">
                  <EditableText id="landing:ai-search-new-search-button" textType="span">
                    Nueva Búsqueda
                  </EditableText>
                </Button>
              </Card>
            ) : (
              <Card className="bg-card p-6 rounded-xl border shadow-lg text-center">
                <div className="mb-4">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">
                    <EditableText id="landing:ai-search-no-results-title" textType="span">
                      No Se Encontraron Coincidencias
                    </EditableText>
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  <EditableText id="landing:ai-search-no-results-description" textType="span">
                    No pudimos encontrar propiedades que coincidan con tu descripción. Intenta modificar tu búsqueda o usar términos más generales.
                  </EditableText>
                </p>
                <Button onClick={() => {
                  form.reset();
                  setHasSearched(false);
                }} variant="outline" className="w-full">
                  <EditableText id="landing:ai-search-try-again-button" textType="span">
                    Intentar Nuevamente
                  </EditableText>
                </Button>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
