
// src/app/admin/appearance/page.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import type { SiteSettings, LandingSectionKey } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Brush, EyeOff, Eye, ListOrdered, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const landingSectionKeySchema = z.enum(["featured_list_requests", "ai_matching", "google_sheet"]);
export type LandingSectionKeyType = z.infer<typeof landingSectionKeySchema>;


const formSchema = z.object({
  siteTitle: z.string().min(5, "El título del sitio debe tener al menos 5 caracteres.").max(100, "El título no puede exceder los 100 caracteres."),
  logoUrl: z.string().url("Debe ser una URL válida para el logo.").or(z.literal('')).optional(),
  show_featured_listings_section: z.boolean().default(true).optional(),
  show_ai_matching_section: z.boolean().default(true).optional(),
  show_google_sheet_section: z.boolean().default(true).optional(),
  landing_sections_order: z.array(landingSectionKeySchema).min(1, "Debe haber al menos una sección en el orden.").default(["featured_list_requests", "ai_matching", "google_sheet"]),
});

type SiteSettingsFormValues = z.infer<typeof formSchema>;

const DEFAULT_FALLBACK_TITLE = 'PropSpot - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKeyType[] = ["featured_list_requests", "ai_matching", "google_sheet"];

const sectionNames: Record<LandingSectionKeyType, string> = {
  featured_list_requests: "Listados Destacados y Solicitudes Recientes",
  ai_matching: "Búsqueda Inteligente (IA)",
  google_sheet: "Datos de Google Sheets",
};

export default function AdminAppearancePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<Partial<SiteSettings>>({});
  const [orderedSections, setOrderedSections] = useState<LandingSectionKeyType[]>(DEFAULT_SECTIONS_ORDER);

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteTitle: DEFAULT_FALLBACK_TITLE,
      logoUrl: "",
      show_featured_listings_section: true,
      show_ai_matching_section: true,
      show_google_sheet_section: true,
      landing_sections_order: DEFAULT_SECTIONS_ORDER,
    },
  });
  const { setValue } = form;

  const resetFormAndState = useCallback((settings: SiteSettings) => {
    const validOrder = settings.landing_sections_order && settings.landing_sections_order.length > 0
                       ? settings.landing_sections_order
                       : DEFAULT_SECTIONS_ORDER;
    
    // Actualizar el estado local primero
    setOrderedSections(validOrder); 
    
    // Luego resetear el formulario. El useEffect se encargará de sincronizar
    // el valor de landing_sections_order del formulario si es necesario,
    // pero es bueno establecerlo aquí también para consistencia inicial.
    form.reset({
      siteTitle: settings.siteTitle || DEFAULT_FALLBACK_TITLE,
      logoUrl: settings.logoUrl || "",
      show_featured_listings_section: settings.show_featured_listings_section === undefined ? true : settings.show_featured_listings_section,
      show_ai_matching_section: settings.show_ai_matching_section === undefined ? true : settings.show_ai_matching_section,
      show_google_sheet_section: settings.show_google_sheet_section === undefined ? true : settings.show_google_sheet_section,
      landing_sections_order: validOrder,
    });
    setCurrentSettings(settings);
  }, [form]);


  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const settings = await getSiteSettingsAction();
      resetFormAndState(settings);
      setIsLoading(false);
    }
    loadSettings();
  }, [resetFormAndState]);
  
  // Sincronizar el estado local `orderedSections` con el campo del formulario `landing_sections_order`
  useEffect(() => {
    setValue('landing_sections_order', orderedSections, {
      shouldValidate: true, // Validar después de cambiar el orden
      shouldDirty: true,    // Marcar como dirty si el orden es diferente al valor inicial del form
    });
  }, [orderedSections, setValue]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setOrderedSections(prevOrder => {
      const newOrder = [...prevOrder];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= newOrder.length) {
        return prevOrder; 
      }
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      return newOrder;
    });
  };


  async function onSubmit(values: SiteSettingsFormValues) {
    // Usar el `orderedSections` del estado local como la fuente de verdad para el guardado.
    // Los `values` del formulario ya deberían estar sincronizados por el useEffect,
    // pero es más seguro usar el estado que controla directamente la UI de reordenamiento.
    const result = await saveSiteSettingsAction({
      siteTitle: values.siteTitle,
      logoUrl: values.logoUrl || null,
      show_featured_listings_section: values.show_featured_listings_section,
      show_ai_matching_section: values.show_ai_matching_section,
      show_google_sheet_section: values.show_google_sheet_section,
      landing_sections_order: orderedSections, 
    });

    if (result.success) {
      toast({
        title: "Apariencia Guardada",
        description: "La configuración de apariencia del sitio se ha guardado correctamente.",
      });
      const updatedSettings = await getSiteSettingsAction();
      resetFormAndState(updatedSettings); // Esto reiniciará isDirty
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
          Personaliza el título, logo, visibilidad y orden de secciones de la página de inicio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
                <h3 className="text-lg font-medium mb-2">Identidad del Sitio</h3>
                <div className="space-y-6 p-4 border rounded-md">
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
                            <Input placeholder="https://ejemplo.com/logo.png" {...field} value={field.value || ''}/>
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
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                            data-ai-hint="logo"
                        />
                        </div>
                        {!form.formState.errors.logoUrl && !isLoading && !form.watch("logoUrl")?.startsWith('http') && form.watch("logoUrl") !== '' && (
                            <p className="text-sm text-destructive">La URL del logo parece inválida. Asegúrate que comience con http:// o https://.</p>
                        )}
                    </div>
                    )}
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-2">Visibilidad de Secciones en la Landing Page</h3>
                 <div className="space-y-4 p-4 border rounded-md">
                    <FormField
                    control={form.control}
                    name="show_featured_listings_section"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                                {field.value ? <Eye className="h-4 w-4 mr-2 text-green-600"/> : <EyeOff className="h-4 w-4 mr-2 text-red-600"/>}
                                Sección de Listados Destacados
                            </FormLabel>
                            <FormDescription>
                            Muestra/Oculta las pestañas de "Propiedades Destacadas" y "Solicitudes Recientes".
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="show_ai_matching_section"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                                {field.value ? <Eye className="h-4 w-4 mr-2 text-green-600"/> : <EyeOff className="h-4 w-4 mr-2 text-red-600"/>}
                                Sección de Búsqueda Inteligente (IA)
                            </FormLabel>
                            <FormDescription>
                            Muestra/Oculta la sección de "Búsqueda Inteligente con IA".
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="show_google_sheet_section"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                                {field.value ? <Eye className="h-4 w-4 mr-2 text-green-600"/> : <EyeOff className="h-4 w-4 mr-2 text-red-600"/>}
                                Sección de Datos de Google Sheets
                            </FormLabel>
                            <FormDescription>
                            Muestra/Oculta la sección que carga datos desde Google Sheets.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                 </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Orden de Secciones en la Landing Page</h3>
              {/* Usamos Controller aquí para conectar `orderedSections` con el form state para validación/dirty-checking */}
              <Controller
                control={form.control}
                name="landing_sections_order"
                render={() => ( 
                  <div className="p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-3">
                      Haz clic en las flechas para cambiar el orden de aparición de las secciones en la página de inicio.
                    </p>
                    <ul className="space-y-2">
                      {orderedSections.map((sectionKey, index) => (
                        <li key={sectionKey} className="flex items-center justify-between p-3 border rounded-md bg-secondary/30 shadow-sm">
                          <div className="flex items-center">
                            <GripVertical className="h-5 w-5 mr-2 text-muted-foreground cursor-grab" />
                            <span className="font-medium">{sectionNames[sectionKey as LandingSectionKeyType] || sectionKey}</span>
                          </div>
                          <div className="space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 0 || form.formState.isSubmitting}
                              aria-label={`Mover ${sectionNames[sectionKey as LandingSectionKeyType]} hacia arriba`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === orderedSections.length - 1 || form.formState.isSubmitting}
                              aria-label={`Mover ${sectionNames[sectionKey as LandingSectionKeyType]} hacia abajo`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                     <FormMessage>{form.formState.errors.landing_sections_order?.message}</FormMessage>
                  </div>
                )}
              />
            </div>


            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </Form>

        {(currentSettings.siteTitle || currentSettings.logoUrl || Object.keys(currentSettings).some(k => k.startsWith('show_'))) && !isLoading &&(
          <div className="mt-8 p-4 border rounded-md bg-secondary/30 space-y-3">
            <h4 className="font-semibold text-lg mb-2">Configuración Actual Guardada:</h4>
            <div>
                <p className="text-sm font-medium">Título del Sitio:</p>
                <p className="text-sm text-muted-foreground">{currentSettings.siteTitle || DEFAULT_FALLBACK_TITLE}</p>
            </div>
            <div>
                <p className="text-sm font-medium">Logo Actual:</p>
                {currentSettings.logoUrl ? (
                <div className="p-2 border rounded bg-card inline-block mt-1">
                    <Image src={currentSettings.logoUrl} alt="Logo actual" width={150} height={40} style={{ objectFit: 'contain', maxHeight: '40px', maxWidth: '150px' }} data-ai-hint="logo"/>
                </div>
                ) : (
                <p className="text-sm text-muted-foreground">Usando logo por defecto.</p>
                )}
            </div>
            <Separator/>
            <div>
                 <p className="text-sm font-medium mb-1">Visibilidad de Secciones:</p>
                 <p className="text-sm text-muted-foreground"><strong>Listados Destacados:</strong> {currentSettings.show_featured_listings_section ? "Visible" : "Oculta"}</p>
                 <p className="text-sm text-muted-foreground"><strong>Búsqueda IA:</strong> {currentSettings.show_ai_matching_section ? "Visible" : "Oculta"}</p>
                 <p className="text-sm text-muted-foreground"><strong>Google Sheets:</strong> {currentSettings.show_google_sheet_section ? "Visible" : "Oculta"}</p>
            </div>
             <Separator/>
             <div>
                 <p className="text-sm font-medium mb-1 flex items-center">
                    <ListOrdered className="h-4 w-4 mr-2 text-primary"/>
                    Orden Actual de Secciones Guardado:
                </p>
                 {(currentSettings.landing_sections_order && currentSettings.landing_sections_order.length > 0) ? (
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-5">
                    {(currentSettings.landing_sections_order || DEFAULT_SECTIONS_ORDER).map((sectionKey) => (
                        <li key={sectionKey}>{sectionNames[sectionKey as LandingSectionKeyType] || sectionKey}</li>
                    ))}
                    </ol>
                 ) : (
                    <p className="text-sm text-muted-foreground pl-5">Orden por defecto.</p>
                 )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    