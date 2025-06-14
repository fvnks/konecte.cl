
// src/app/ai-matching/page.tsx
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
  FormDescription, // Added import
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription as PageCardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Renamed CardDescription
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { findMatchingRequestsForProperty, type FindMatchingRequestsInput, type FindMatchingRequestsOutput, type MatchResult } from '@/ai/flows/find-matching-requests-flow';
import { useState, useEffect, useCallback, Suspense } from "react"; 
import { useSearchParams } from 'next/navigation';
import { Loader2, Sparkles, Percent, MessageSquareText, AlertTriangle, SearchCheck, Building } from "lucide-react";

const formSchema = z.object({
  propertyId: z.string().uuid("Por favor, ingresa un UUID válido para el ID de la propiedad."),
});

type AiMatchSearchFormValues = z.infer<typeof formSchema>;

function AiMatchSearchPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<FindMatchingRequestsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  const form = useForm<AiMatchSearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
    },
  });

  const onSubmit = useCallback(async (values: AiMatchSearchFormValues) => {
    setIsLoading(true);
    setSearchResult(null);
    setError(null);
    try {
      const input: FindMatchingRequestsInput = {
        propertyId: values.propertyId,
      };
      const result = await findMatchingRequestsForProperty(input);
      setSearchResult(result);
      if (result.matches.length > 0) {
        toast({
          title: "Búsqueda de Coincidencias Completada",
          description: `Se encontraron ${result.matches.length} solicitud(es) para la propiedad "${result.propertyName}".`,
        });
      } else {
         toast({
          title: "Búsqueda Completada",
          description: `No se encontraron solicitudes coincidentes para la propiedad "${result.propertyName}".`,
          variant: "default"
        });
      }
    } catch (err: any) {
      console.error("Error calling AI match search flow:", err);
      const errorMessage = err.message || "Ocurrió un error al procesar la búsqueda de coincidencias.";
      setError(errorMessage);
      toast({
        title: "Error en la Búsqueda",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const propertyIdFromUrl = searchParams.get('propertyId');
    if (propertyIdFromUrl && !initialSearchDone && form.getValues('propertyId') !== propertyIdFromUrl) {
      form.setValue('propertyId', propertyIdFromUrl, { shouldValidate: true });
      onSubmit({ propertyId: propertyIdFromUrl });
      setInitialSearchDone(true);
    }
  }, [searchParams, form, onSubmit, initialSearchDone]);


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center flex items-center justify-center">
            <SearchCheck className="h-8 w-8 mr-3 text-primary" />
            Encontrar Solicitudes para mi Propiedad (IA)
          </CardTitle>
          <PageCardDescription className="text-center text-lg">
            Ingresa el ID de una propiedad (previamente creada en konecte) y nuestra IA buscará las solicitudes de usuarios que mejor coincidan.
          </PageCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">ID de tu Propiedad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pega aquí el ID (UUID) de tu propiedad..."
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                       Puedes obtener el ID desde <Link href="/properties" className="text-primary hover:underline">tus propiedades publicadas</Link> o el panel de administración.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto text-base py-3 h-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Buscando Coincidencias...
                  </>
                ) : (
                  <>
                    <SearchCheck className="mr-2 h-5 w-5" />
                    Buscar Solicitudes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground text-lg">Analizando con IA, esto puede tomar un momento...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error en la Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{error}</p>
          </CardContent>
        </Card>
      )}

      {searchResult && !isLoading && !error && (
        <Card className="shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Building className="h-7 w-7 mr-3 text-accent" />
              Solicitudes Sugeridas para: <Link href={`/properties/${searchResult.propertySlug}`} className="text-primary hover:underline ml-2">{searchResult.propertyName}</Link>
            </CardTitle>
             {searchResult.matches.length === 0 && (
                <PageCardDescription className="text-base">
                    No se encontraron solicitudes de búsqueda que coincidan significativamente con esta propiedad.
                </PageCardDescription>
            )}
          </CardHeader>
          {searchResult.matches.length > 0 && (
            <CardContent className="space-y-6">
              {searchResult.matches.map((match: MatchResult) => (
                <Card key={match.requestId} className="bg-secondary/30 p-4 rounded-lg">
                  <CardTitle className="text-lg mb-2">
                    <Link href={`/requests/${match.requestSlug}`} className="hover:text-primary hover:underline">
                      {match.requestTitle}
                    </Link>
                  </CardTitle>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium">Puntuación de Coincidencia:</h3>
                    <span className="text-lg font-bold text-accent">
                      {(match.matchScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={match.matchScore * 100} className="w-full h-2 [&>div]:bg-accent" />
                  <div className="mt-3">
                    <h3 className="text-sm font-medium flex items-center mb-1">
                      <MessageSquareText className="h-4 w-4 mr-2 text-muted-foreground" />
                      Justificación de la IA:
                    </h3>
                    <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded-md whitespace-pre-line">
                      {match.reason}
                    </p>
                  </div>
                   <Button size="sm" variant="outline" asChild className="mt-3">
                       <Link href={`/requests/${match.requestSlug}`}>Ver Solicitud</Link>
                   </Button>
                </Card>
              ))}
            </CardContent>
          )}
           <CardFooter>
            <p className="text-xs text-muted-foreground">
              Nota: Estas son sugerencias generadas por IA. Siempre verifica los detalles manualmente.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default function AiMatchSearchPage() {
  return (
    <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mt-20" />}>
      <AiMatchSearchPageContent />
    </Suspense>
  );
}

