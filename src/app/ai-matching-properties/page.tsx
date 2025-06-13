// src/app/ai-matching-properties/page.tsx
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { findMatchingPropertiesForRequest, type FindMatchingPropertiesInput, type FindMatchingPropertiesOutput, type PropertyMatchResult } from '@/ai/flows/find-matching-properties-flow';
import { useState } from "react";
import { Loader2, Sparkles, Percent, MessageSquareText, AlertTriangle, Building, FileSearch } from "lucide-react";

const formSchema = z.object({
  requestId: z.string().uuid("Por favor, ingresa un UUID válido para el ID de la solicitud."),
});

type AiMatchPropertiesFormValues = z.infer<typeof formSchema>;

export default function AiMatchPropertiesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<FindMatchingPropertiesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AiMatchPropertiesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestId: "",
    },
  });

  async function onSubmit(values: AiMatchPropertiesFormValues) {
    setIsLoading(true);
    setSearchResult(null);
    setError(null);
    try {
      const input: FindMatchingPropertiesInput = {
        requestId: values.requestId,
      };
      const result = await findMatchingPropertiesForRequest(input);
      setSearchResult(result);
      if (result.matches.length > 0) {
        toast({
          title: "Búsqueda de Propiedades Completada",
          description: `Se encontraron ${result.matches.length} propiedad(es) para la solicitud "${result.requestName}".`,
        });
      } else {
         toast({
          title: "Búsqueda Completada",
          description: `No se encontraron propiedades coincidentes para la solicitud "${result.requestName}".`,
          variant: "default"
        });
      }
    } catch (err: any) {
      console.error("Error calling AI match properties flow:", err);
      const errorMessage = err.message || "Ocurrió un error al procesar la búsqueda de propiedades.";
      setError(errorMessage);
      toast({
        title: "Error en la Búsqueda",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center flex items-center justify-center">
            <Building className="h-8 w-8 mr-3 text-primary" />
            Buscar Propiedades Coincidentes (IA)
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Ingresa el ID de una solicitud de búsqueda y nuestra IA buscará las propiedades que mejor coincidan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">ID de la Solicitud</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pega aquí el ID (UUID) de la solicitud a analizar..."
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Puedes obtener el ID de la solicitud desde el panel de administración o la URL de la solicitud.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto text-base py-3 h-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Buscando Propiedades...
                  </>
                ) : (
                  <>
                    <Building className="mr-2 h-5 w-5" />
                    Buscar Propiedades
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
              <FileSearch className="h-7 w-7 mr-3 text-accent" />
              Resultados para la Solicitud: <Link href={`/requests/${searchResult.requestSlug}`} className="text-primary hover:underline ml-2">{searchResult.requestName}</Link>
            </CardTitle>
             {searchResult.matches.length === 0 && (
                <CardDescription className="text-base">
                    No se encontraron propiedades que coincidan significativamente con esta solicitud.
                </CardDescription>
            )}
          </CardHeader>
          {searchResult.matches.length > 0 && (
            <CardContent className="space-y-6">
              {searchResult.matches.map((match: PropertyMatchResult) => (
                <Card key={match.propertyId} className="bg-secondary/30 p-4 rounded-lg">
                  <CardTitle className="text-lg mb-2">
                    <Link href={`/properties/${match.propertySlug}`} className="hover:text-primary hover:underline">
                      {match.propertyTitle}
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
                       <Link href={`/properties/${match.propertySlug}`}>Ver Propiedad</Link>
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
