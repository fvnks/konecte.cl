
// src/app/ai-matching/page.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { propertyMatching, type PropertyMatchingInput, type PropertyMatchingOutput } from '@/ai/flows/property-matching';
import { useState } from "react";
import { Loader2, Sparkles, Percent, MessageSquareText, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  propertyDescription: z.string().min(10, "La descripción de la propiedad debe tener al menos 10 caracteres."),
  searchRequest: z.string().min(10, "La solicitud de búsqueda debe tener al menos 10 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function AiMatchingPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<PropertyMatchingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AiMatchingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyDescription: "",
      searchRequest: "",
    },
  });

  async function onSubmit(values: AiMatchingFormValues) {
    setIsLoading(true);
    setMatchResult(null);
    setError(null);
    try {
      const input: PropertyMatchingInput = {
        propertyDescription: values.propertyDescription,
        searchRequest: values.searchRequest,
      };
      const result = await propertyMatching(input);
      setMatchResult(result);
      toast({
        title: "Análisis Completado",
        description: "Se ha calculado la coincidencia.",
      });
    } catch (err: any) {
      console.error("Error calling AI matching flow:", err);
      setError(err.message || "Ocurrió un error al procesar la solicitud de IA.");
      toast({
        title: "Error de IA",
        description: err.message || "No se pudo obtener una respuesta de la IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-3 text-primary" />
            Emparejamiento de Propiedades con IA
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Ingresa la descripción de una propiedad y una solicitud de búsqueda para ver qué tan bien coinciden según nuestra IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="propertyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Descripción de la Propiedad</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Departamento moderno de 3 habitaciones, 2 baños, con balcón y vista al mar en Reñaca. Incluye estacionamiento y bodega..."
                        className="min-h-[120px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="searchRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Solicitud de Búsqueda del Usuario</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Busco un departamento para arriendo en la V Región, mínimo 2 dormitorios, que acepte mascotas y tenga buena conexión a internet..."
                        className="min-h-[120px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto text-base py-3 h-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analizando Coincidencia...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Encontrar Coincidencia
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
          <p className="mt-3 text-muted-foreground text-lg">Procesando con IA, por favor espera...</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error al Procesar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive/90">{error}</p>
          </CardContent>
        </Card>
      )}

      {matchResult && !isLoading && !error && (
        <Card className="shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Percent className="h-7 w-7 mr-3 text-accent" />
              Resultado del Emparejamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-medium">Puntuación de Coincidencia:</h3>
                <span className="text-2xl font-bold text-accent">
                  {(matchResult.matchScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={matchResult.matchScore * 100} className="w-full h-3 [&>div]:bg-accent" />
            </div>
            <div>
              <h3 className="text-lg font-medium flex items-center mb-1">
                <MessageSquareText className="h-5 w-5 mr-2 text-muted-foreground" />
                Justificación de la IA:
              </h3>
              <p className="text-muted-foreground bg-secondary/50 p-4 rounded-md whitespace-pre-line">
                {matchResult.reason}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Nota: Esta es una sugerencia generada por IA. Siempre verifica los detalles manualmente.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

