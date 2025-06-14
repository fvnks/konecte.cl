
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
import { recordUserListingInteractionAction } from '@/actions/interactionActions'; // Import the new action
import type { User as StoredUser, InteractionTypeEnum } from '@/lib/types'; // Import StoredUser
import { useState, useEffect } from "react";
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, SearchIcon, Building, PlusCircle, ThumbsUp, ThumbsDown, UserCircle as UserIconLucide } from "lucide-react";
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';

const formSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de tu búsqueda debe tener al menos 10 caracteres.").max(1000, "Máximo 1000 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function InteractiveAIMatching() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState<FoundMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);

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
    setFilteredProperties([]);
    setError(null);
    setHasSearched(true);
    setCurrentIndex(0);
    try {
      const input: FindListingsForFreeTextSearchInput = {
        userSearchDescription: values.userSearchDescription,
      };
      const result = await findListingsForFreeTextSearch(input);
      
      const propertiesOnly = result.matches.filter(match => match.type === 'property');
      setFilteredProperties(propertiesOnly);

      if (propertiesOnly.length > 0) {
        toast({
          title: "Búsqueda IA Completada",
          description: `Se encontraron ${propertiesOnly.length} propiedad(es) sugerida(s). ¡Ahora puedes indicar cuáles te gustan!`,
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

    try {
      await recordUserListingInteractionAction(loggedInUser.id, {
        listingId,
        listingType: 'property', // Since we are only showing properties here
        interactionType,
      });
      toast({
        title: "Preferencia Guardada",
        description: `Tu preferencia (${interactionType === 'like' ? 'Me gusta' : 'No me gusta'}) ha sido registrada.`,
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo guardar tu preferencia: ${error.message}`,
        variant: "destructive",
      });
    }

    // Avanzar a la siguiente tarjeta
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const currentPropertyMatch = filteredProperties[currentIndex];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userSearchDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-medium">Describe lo que buscas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Busco un departamento para arriendo en la V Región, mínimo 2 dormitorios, que acepte mascotas y tenga buena conexión a internet. Presupuesto máximo $700.000..."
                    className="min-h-[120px]"
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
                    Propiedad Sugerida
                    </Badge>
                    <div className="text-right">
                    <span className="text-lg font-bold text-accent">
                        {(currentPropertyMatch.matchScore * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-muted-foreground -mt-1">Coincidencia</p>
                    </div>
                </div>
                <Progress value={currentPropertyMatch.matchScore * 100} className="w-full h-1.5 [&>div]:bg-accent mb-3" />
                
                <FeaturedPropertyCard property={currentPropertyMatch.item as any} />
                
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
                        disabled={!loggedInUser}
                        title={!loggedInUser ? "Inicia sesión para interactuar" : "No me gusta"}
                    >
                        <ThumbsDown className="h-6 w-6" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-green-500 border-green-500 hover:bg-green-50 hover:text-green-600 h-12 w-28"
                        onClick={() => handleInteraction(currentPropertyMatch.item.id, 'like')}
                        disabled={!loggedInUser}
                        title={!loggedInUser ? "Inicia sesión para interactuar" : "Me gusta"}
                    >
                        <ThumbsUp className="h-6 w-6" />
                    </Button>
                </div>
                {!loggedInUser && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                        <UserIconLucide className="inline-block h-3 w-3 mr-1 align-text-bottom" />
                        <Link href="/auth/signin" className="underline hover:text-primary">Inicia sesión</Link> para guardar tus preferencias.
                    </p>
                )}
            </Card>
          ) : ( // No hay más propiedades en la lista actual O la lista inicial estaba vacía
            <CardContent className="px-0 pt-4 text-center">
              <p className="text-muted-foreground text-base mb-4">
                {filteredProperties.length > 0 && currentIndex >= filteredProperties.length 
                  ? "Has revisado todas las sugerencias de IA para esta búsqueda." 
                  : "No encontramos propiedades que coincidan con tu descripción en este momento."}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Puedes intentar reformular tu búsqueda o publicarla para que otros usuarios y corredores puedan encontrarla y ofrecerte propiedades.
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


    