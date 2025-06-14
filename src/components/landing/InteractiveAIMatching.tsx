
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
import { useState } from "react";
import { Loader2, Sparkles, MessageSquareText, AlertTriangle, SearchIcon, Building, FileSearch } from "lucide-react";
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
import RequestCard from '@/components/request/RequestCard';

const formSchema = z.object({
  userSearchDescription: z.string().min(10, "La descripción de tu búsqueda debe tener al menos 10 caracteres.").max(1000, "Máximo 1000 caracteres."),
});

type AiMatchingFormValues = z.infer<typeof formSchema>;

export default function InteractiveAIMatching() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<FindListingsForFreeTextSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AiMatchingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSearchDescription: "",
    },
  });

  async function onSubmit(values: AiMatchingFormValues) {
    setIsLoading(true);
    setSearchResult(null);
    setError(null);
    try {
      const input: FindListingsForFreeTextSearchInput = {
        userSearchDescription: values.userSearchDescription,
      };
      const result = await findListingsForFreeTextSearch(input);
      setSearchResult(result);
      if (result.matches.length > 0) {
        toast({
          title: "Búsqueda IA Completada",
          description: `Se encontraron ${result.matches.length} posibles coincidencias para tu búsqueda.`,
        });
      } else {
        toast({
          title: "Búsqueda IA Completada",
          description: "No se encontraron coincidencias directas. Intenta ser más específico o más general.",
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userSearchDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-md font-medium">Descripción de lo que buscas</FormLabel>
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
                Buscar Propiedades y Solicitudes con IA
              </>
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="text-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Analizando y buscando en la plataforma...</p>
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

      {searchResult && !isLoading && !error && (
        <Card className="shadow-md mt-6 animate-fade-in bg-transparent border-none">
          <CardHeader className="px-0 pt-2 pb-4">
            <CardTitle className="text-xl font-headline flex items-center">
              <SearchIcon className="h-6 w-6 mr-2 text-accent" />
              Resultados Sugeridos por IA ({searchResult.matches.length})
            </CardTitle>
          </CardHeader>
          {searchResult.matches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {searchResult.matches.map((match: FoundMatch, index: number) => (
                <Card key={`${match.type}-${match.item.id}-${index}`} className="bg-card p-4 rounded-xl border flex flex-col shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={match.type === 'property' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {match.type === 'property' ? <Building className="mr-1.5 h-3.5 w-3.5"/> : <FileSearch className="mr-1.5 h-3.5 w-3.5"/>}
                      {match.type === 'property' ? 'Propiedad' : 'Solicitud'}
                    </Badge>
                    <div className="text-right">
                      <span className="text-lg font-bold text-accent">
                        {(match.matchScore * 100).toFixed(0)}%
                      </span>
                       <p className="text-xs text-muted-foreground -mt-1">Coincidencia</p>
                    </div>
                  </div>
                  <Progress value={match.matchScore * 100} className="w-full h-1.5 [&>div]:bg-accent mb-3" />
                  
                  {match.type === 'property' && <FeaturedPropertyCard property={match.item as any} />}
                  {match.type === 'request' && <RequestCard request={match.item as any} />}
                  
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <h4 className="text-xs font-semibold flex items-center mb-1 text-muted-foreground">
                      <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
                      IA Dice:
                    </h4>
                    <p className="text-xs text-muted-foreground/80 bg-secondary/30 p-2 rounded-md whitespace-pre-line italic">
                      {match.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <CardContent className="px-0">
              <p className="text-muted-foreground text-center py-6">
                No se encontraron propiedades o solicitudes que coincidan significativamente con tu descripción. Intenta ser más específico o general.
              </p>
            </CardContent>
          )}
           {searchResult.matches.length > 0 && (
                <CardFooter className="px-0 pt-6">
                    <p className="text-xs text-muted-foreground italic">
                    Nota: Estas son sugerencias generadas por IA. La relevancia puede variar.
                    </p>
                </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
}

