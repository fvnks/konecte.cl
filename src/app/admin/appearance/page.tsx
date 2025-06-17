
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveSiteSettingsAction, getSiteSettingsAction } from "@/actions/siteSettingsActions";
import type { SiteSettings, LandingSectionKey } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Brush, EyeOff, Eye, ListOrdered, ArrowUp, ArrowDown, GripVertical, Megaphone, Palette } from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const landingSectionKeySchema = z.enum(["featured_list_requests", "ai_matching", "analisis_whatsbot"]);
export type LandingSectionKeyType = z.infer<typeof landingSectionKeySchema>;

const hexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;

const formSchema = z.object({
  siteTitle: z.string().min(5, "El título del sitio debe tener al menos 5 caracteres.").max(100, "El título no puede exceder los 100 caracteres."),
  logoUrl: z.string().url("Debe ser una URL válida para el logo.").or(z.literal('')).optional(),
  show_featured_listings_section: z.boolean().default(true).optional(),
  show_ai_matching_section: z.boolean().default(true).optional(),
  show_google_sheet_section: z.boolean().default(true).optional(), // Field name in DB remains
  landing_sections_order: z.array(landingSectionKeySchema).min(1, "Debe haber al menos una sección en el orden.").default(["featured_list_requests", "ai_matching", "analisis_whatsbot"]),
  // Nuevos campos para la barra de anuncios
  announcement_bar_is_active: z.boolean().default(false).optional(),
  announcement_bar_text: z.string().max(250, "El texto del anuncio no puede exceder los 250 caracteres.").optional().or(z.literal('')),
  announcement_bar_link_text: z.string().max(50, "El texto del enlace no puede exceder los 50 caracteres.").optional().or(z.literal('')),
  announcement_bar_link_url: z.string().url("Debe ser una URL válida para el enlace.").or(z.literal('')).optional(),
  announcement_bar_bg_color: z.string()
    .regex(hexColorRegex, "Debe ser un código hexadecimal de color válido (ej: #FFB74D o #FBD).")
    .optional().or(z.literal('')),
  announcement_bar_text_color: z.string()
    .regex(hexColorRegex, "Debe ser un código hexadecimal de color válido (ej: #18181B o #000).")
    .optional().or(z.literal('')),
}).refine(data => {
  const textProvided = data.announcement_bar_link_text && data.announcement_bar_link_text.trim() !== '';
  const urlProvided = data.announcement_bar_link_url && data.announcement_bar_link_url.trim() !== '';
  if ((textProvided && !urlProvided) || (!textProvided && urlProvided)) {
    return false;
  }
  return true;
}, {
  message: "Si proporcionas un texto para el enlace del anuncio, también debes proporcionar una URL (y viceversa). Ambos o ninguno.",
  path: ["announcement_bar_link_url"], 
});

type SiteSettingsFormValues = z.infer<typeof formSchema>;

const DEFAULT_FALLBACK_TITLE = 'konecte - Encuentra Tu Próxima Propiedad';
const DEFAULT_SECTIONS_ORDER: LandingSectionKeyType[] = ["featured_list_requests", "ai_matching", "analisis_whatsbot"];
const DEFAULT_ANNOUNCEMENT_BG_COLOR = '#FFB74D';
const DEFAULT_ANNOUNCEMENT_TEXT_COLOR = '#18181b';


const sectionNames: Record<LandingSectionKeyType, string> = {
  featured_list_requests: "Listados Destacados y Solicitudes Recientes",
  ai_matching: "Búsqueda Inteligente (IA)",
  analisis_whatsbot: "Análisis WhatsBot", // Updated label
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
      announcement_bar_is_active: false,
      announcement_bar_text: "",
      announcement_bar_link_text: "",
      announcement_bar_link_url: "",
      announcement_bar_bg_color: DEFAULT_ANNOUNCEMENT_BG_COLOR,
      announcement_bar_text_color: DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
    },
  });
  const { setValue, watch } = form;
  const watchedBgColor = watch("announcement_bar_bg_color");
  const watchedTextColor = watch("announcement_bar_text_color");


  const resetFormAndState = useCallback((settings: SiteSettings) => {
    const validOrder = settings.landing_sections_order && settings.landing_sections_order.length > 0
                       ? settings.landing_sections_order
                       : DEFAULT_SECTIONS_ORDER;
    
    setOrderedSections(validOrder); 
    
    form.reset({
      siteTitle: settings.siteTitle || DEFAULT_FALLBACK_TITLE,
      logoUrl: settings.logoUrl || "",
      show_featured_listings_section: settings.show_featured_listings_section === undefined ? true : settings.show_featured_listings_section,
      show_ai_matching_section: settings.show_ai_matching_section === undefined ? true : settings.show_ai_matching_section,
      show_google_sheet_section: settings.show_google_sheet_section === undefined ? true : settings.show_google_sheet_section,
      landing_sections_order: validOrder,
      announcement_bar_is_active: settings.announcement_bar_is_active || false,
      announcement_bar_text: settings.announcement_bar_text || "",
      announcement_bar_link_text: settings.announcement_bar_link_text || "",
      announcement_bar_link_url: settings.announcement_bar_link_url || "",
      announcement_bar_bg_color: settings.announcement_bar_bg_color || DEFAULT_ANNOUNCEMENT_BG_COLOR,
      announcement_bar_text_color: settings.announcement_bar_text_color || DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
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
  
  useEffect(() => {
    setValue('landing_sections_order', orderedSections, {
      shouldValidate: true, 
      shouldDirty: true,    
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
    const result = await saveSiteSettingsAction({
      ...values, // Incluye todos los valores del formulario validados
      landing_sections_order: orderedSections, 
    });

    if (result.success) {
      toast({
        title: "Apariencia Guardada",
        description: "La configuración de apariencia del sitio se ha guardado correctamente.",
      });
      const updatedSettings = await getSiteSettingsAction();
      resetFormAndState(updatedSettings); 
      window.dispatchEvent(new CustomEvent('siteSettingsUpdated')); // Para Navbar
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
          Personaliza el título, logo, barra de anuncios, visibilidad y orden de secciones de la página de inicio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Identidad del Sitio */}
            <div>
                <h3 className="text-lg font-medium mb-2">Identidad del Sitio</h3>
                <div className="space-y-6 p-4 border rounded-md">
                    {/* ... campos de siteTitle y logoUrl existentes ... */}
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
            
            {/* Barra de Anuncios */}
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center"><Megaphone className="h-5 w-5 mr-2 text-primary"/>Barra de Anuncios</h3>
              <div className="space-y-6 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="announcement_bar_is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Mostrar Barra de Anuncios</FormLabel>
                        <FormDescription>Activa para mostrar la barra en la parte superior del sitio.</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="announcement_bar_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto del Anuncio</FormLabel>
                      <FormControl><Textarea placeholder="Ej: ¡Oferta especial! 20% de descuento en todas las publicaciones." {...field} value={field.value ?? ''} rows={2} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="announcement_bar_link_text"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Texto del Enlace (Opcional)</FormLabel>
                        <FormControl><Input placeholder="Ej: Ver oferta" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="announcement_bar_link_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL del Enlace (Opcional)</FormLabel>
                        <FormControl><Input placeholder="https://ejemplo.com/oferta" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="announcement_bar_bg_color"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Color de Fondo (HEX)</FormLabel>
                            <FormControl><Input placeholder="#FFB74D" {...field} value={field.value ?? ''} /></FormControl>
                            <FormDescription>Ej: #FFB74D (Naranja)</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="announcement_bar_text_color"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Color del Texto (HEX)</FormLabel>
                            <FormControl><Input placeholder="#18181B" {...field} value={field.value ?? ''} /></FormControl>
                             <FormDescription>Ej: #18181B (Oscuro)</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                 <div className="space-y-2">
                    <FormLabel>Vista Previa de la Barra de Anuncios:</FormLabel>
                    <div 
                        style={{
                            backgroundColor: form.watch("announcement_bar_bg_color") || DEFAULT_ANNOUNCEMENT_BG_COLOR, 
                            color: form.watch("announcement_bar_text_color") || DEFAULT_ANNOUNCEMENT_TEXT_COLOR
                        }}
                        className="p-3 rounded-md text-center text-sm"
                    >
                        {form.watch("announcement_bar_text") || "Tu texto de anuncio aquí."}
                        {form.watch("announcement_bar_link_text") && form.watch("announcement_bar_link_url") && (
                            <a 
                                href={form.watch("announcement_bar_link_url") || '#'} // Usar '#' como fallback para preview
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline ml-2 hover:opacity-80"
                                style={{color: form.watch("announcement_bar_text_color") || DEFAULT_ANNOUNCEMENT_TEXT_COLOR}}
                                onClick={(e) => e.preventDefault()} // Prevenir navegación en la preview
                            >
                                {form.watch("announcement_bar_link_text")}
                            </a>
                        )}
                    </div>
                 </div>
              </div>
            </div>

            <Separator />

            {/* Visibilidad de Secciones */}
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
                                Sección de Análisis WhatsBot
                            </FormLabel>
                            <FormDescription>
                            Muestra/Oculta la sección de "Análisis WhatsBot" (datos de Google Sheets).
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

            {/* Orden de Secciones */}
            <div>
              <h3 className="text-lg font-medium mb-2">Orden de Secciones en la Landing Page</h3>
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

        {/* Vista previa de la Configuración Actual */}
        {!isLoading && (
          <div className="mt-8 p-4 border rounded-md bg-secondary/30 space-y-3">
            <h4 className="font-semibold text-lg mb-2">Configuración Actual Guardada:</h4>
            {/* ... Título y Logo ... */}
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
            {/* Barra de Anuncios Actual */}
             <div>
                <p className="text-sm font-medium mb-1 flex items-center"><Megaphone className="h-4 w-4 mr-1.5 text-primary"/>Barra de Anuncios:</p>
                 <p className="text-sm text-muted-foreground"><strong>Estado:</strong> {currentSettings.announcement_bar_is_active ? "Activa" : "Inactiva"}</p>
                {currentSettings.announcement_bar_is_active && (
                    <>
                        <p className="text-sm text-muted-foreground"><strong>Texto:</strong> {currentSettings.announcement_bar_text || "N/A"}</p>
                        {currentSettings.announcement_bar_link_text && currentSettings.announcement_bar_link_url && (
                             <p className="text-sm text-muted-foreground"><strong>Enlace:</strong> {currentSettings.announcement_bar_link_text} ({currentSettings.announcement_bar_link_url})</p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Palette className="h-3 w-3"/>
                            <strong>Colores:</strong> 
                            <span style={{backgroundColor: currentSettings.announcement_bar_bg_color || DEFAULT_ANNOUNCEMENT_BG_COLOR, padding: '0.1em 0.3em', borderRadius: '3px', color: currentSettings.announcement_bar_text_color || DEFAULT_ANNOUNCEMENT_TEXT_COLOR, border: '1px solid var(--border)'}}>
                                Fondo: {currentSettings.announcement_bar_bg_color}
                            </span>
                            <span style={{backgroundColor: currentSettings.announcement_bar_text_color || DEFAULT_ANNOUNCEMENT_TEXT_COLOR, padding: '0.1em 0.3em', borderRadius: '3px', color: currentSettings.announcement_bar_bg_color || DEFAULT_ANNOUNCEMENT_BG_COLOR, border: '1px solid var(--border)'}}>
                                Texto: {currentSettings.announcement_bar_text_color}
                            </span>
                        </p>
                    </>
                )}
            </div>
            <Separator/>
            {/* ... Visibilidad y Orden de Secciones ... */}
            <div>
                 <p className="text-sm font-medium mb-1">Visibilidad de Secciones:</p>
                 <p className="text-sm text-muted-foreground"><strong>Listados Destacados:</strong> {currentSettings.show_featured_listings_section ? "Visible" : "Oculta"}</p>
                 <p className="text-sm text-muted-foreground"><strong>Búsqueda IA:</strong> {currentSettings.show_ai_matching_section ? "Visible" : "Oculta"}</p>
                 <p className="text-sm text-muted-foreground"><strong>Análisis WhatsBot:</strong> {currentSettings.show_google_sheet_section ? "Visible" : "Oculta"}</p>
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

