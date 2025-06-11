
// src/app/admin/appearance/page.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveSiteSettingsAction, getSiteSettingsAction } from "@/actions/siteSettingsActions";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2, Brush } from "lucide-react";
import Image from "next/image";

const formSchema = z.object({
  siteTitle: z.string().min(5, "El título del sitio debe tener al menos 5 caracteres.").max(100, "El título no puede exceder los 100 caracteres."),
  logoUrl: z.string().url("Debe ser una URL válida para el logo.").or(z.literal('')).optional(),
});

type SiteSettingsFormValues = z.infer<typeof formSchema>;

const DEFAULT_FALLBACK_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';

export default function AdminAppearancePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<Partial<SiteSettings>>({});

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteTitle: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const settings = await getSiteSettingsAction();
      form.reset({
        siteTitle: settings.siteTitle || DEFAULT_FALLBACK_TITLE,
        logoUrl: settings.logoUrl || "",
      });
      setCurrentSettings(settings);
      setIsLoading(false);
    }
    loadSettings();
  }, [form]);

  async function onSubmit(values: SiteSettingsFormValues) {
    const result = await saveSiteSettingsAction({
      siteTitle: values.siteTitle,
      logoUrl: values.logoUrl || null, // Guardar null si está vacío
    });
    if (result.success) {
      toast({
        title: "Apariencia Guardada",
        description: "La configuración de apariencia del sitio se ha guardado correctamente.",
      });
      const updatedSettings = await getSiteSettingsAction(); // Recargar para mostrar lo guardado
      setCurrentSettings(updatedSettings);
       form.reset({ // Sincronizar el formulario con los datos recién guardados
        siteTitle: updatedSettings.siteTitle || DEFAULT_FALLBACK_TITLE,
        logoUrl: updatedSettings.logoUrl || "",
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "No se pudo guardar la configuración de apariencia.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando configuración de apariencia...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <Brush className="h-6 w-6 mr-2 text-primary" />
          Configuración de Apariencia del Sitio
        </CardTitle>
        <CardDescription>
          Personaliza el título principal de la landing page y el logo del sitio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="siteTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Principal del Sitio (Landing Page)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: El Mejor Lugar para Propiedades" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este título aparecerá prominentemente en la página de inicio.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Logo del Sitio (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ingresa la URL completa de tu logo. Si se deja vacío, se usará el logo por defecto.
                    Recomendado: PNG transparente, altura aproximada de 30-40px.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("logoUrl") && (
              <div className="space-y-2">
                <FormLabel>Vista Previa del Logo:</FormLabel>
                <div className="p-4 border rounded-md bg-muted flex items-center justify-center h-20">
                  <Image 
                    src={form.watch("logoUrl")!} 
                    alt="Vista previa del logo" 
                    width={150} 
                    height={40} 
                    style={{ objectFit: 'contain', maxHeight: '40px', maxWidth: '150px' }}
                    onError={(e) => (e.currentTarget.style.display = 'none')} // Ocultar si hay error cargando
                  />
                </div>
                 {!form.formState.errors.logoUrl && !isLoading && !form.watch("logoUrl")?.startsWith('http') && form.watch("logoUrl") !== '' && (
                    <p className="text-sm text-destructive">La URL del logo parece inválida. Asegúrate que comience con http:// o https://.</p>
                )}
              </div>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </Form>
        
        {(currentSettings.siteTitle || currentSettings.logoUrl) && !isLoading &&(
          <div className="mt-8 p-4 border rounded-md bg-secondary/30">
            <h4 className="font-semibold mb-2">Configuración Actual Guardada:</h4>
            <p className="text-sm"><strong>Título del Sitio:</strong> {currentSettings.siteTitle || DEFAULT_FALLBACK_TITLE}</p>
            {currentSettings.logoUrl ? (
              <div className="mt-2">
                <p className="text-sm"><strong>Logo Actual:</strong></p>
                <div className="p-2 border rounded bg-card inline-block mt-1">
                    <Image src={currentSettings.logoUrl} alt="Logo actual" width={150} height={40} style={{ objectFit: 'contain', maxHeight: '40px', maxWidth: '150px' }} />
                </div>
              </div>
            ) : (
              <p className="text-sm"><strong>Logo Actual:</strong> Usando logo por defecto.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```