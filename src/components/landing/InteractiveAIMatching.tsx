// src/components/landing/InteractiveAIMatching.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Card for result display
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { propertyMatching, type PropertyMatchingInput, type PropertyMatchingOutput } from '@/ai/flows/property-matching';
import { useState } from "react";
import { Loader2, Sparkles, Percent, MessageSquareText, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  propertyDescription: z.string().min(10, "La descripción de la propiedad debe tener al menos 10 caracteres.").max(2000, "Máximo 2000 caracteres."),
  searchRequest: z.string().min(10, "La solicitud de búsqueda debe tener al menos 10 caracteres.").max(2000, "Máximo 2000 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function InteractiveAIMatching() {
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
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="propertyDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-medium">Descripción de la Propiedad</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Departamento moderno de 3 habitaciones, 2 baños, con balcón y vista al mar en Reñaca. Incluye estacionamiento y bodega..."
                    className="min-h-[100px]"
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
                <FormLabel className="text-md font-medium">Solicitud de Búsqueda del Usuario</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Busco un departamento para arriendo en la V Región, mínimo 2 dormitorios, que acepte mascotas y tenga buena conexión a internet..."
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
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Buscar Coincidencia con IA
              </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Procesando con IA, espera un momento...</p>
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

      {matchResult && !isLoading && !error && (
        <Card className="shadow-md mt-6 animate-fade-in bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <Percent className="h-6 w-6 mr-2 text-accent" />
              Resultado del Emparejamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-md font-medium">Puntuación de Coincidencia:</h3>
                <span className="text-xl font-bold text-accent">
                  {(matchResult.matchScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={matchResult.matchScore * 100} className="w-full h-2.5 [&>div]:bg-accent" />
            </div>
            <div>
              <h3 className="text-md font-medium flex items-center mb-1">
                <MessageSquareText className="h-5 w-5 mr-2 text-muted-foreground" />
                Justificación de la IA:
              </h3>
              <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-md whitespace-pre-line">
                {matchResult.reason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
