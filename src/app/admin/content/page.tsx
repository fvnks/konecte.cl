// src/app/admin/content/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { EditableText } from '@/lib/types';
import { getEditableTextsAction, updateEditableTextAction } from '@/actions/editableTextActions';
import { Loader2, Save, Newspaper, AlertCircle, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import StaticText from "@/components/ui/StaticText";

const editableTextSchema = z.object({
  id: z.string(),
  content_current: z.string().max(5000, "El contenido no puede exceder los 5000 caracteres.").nullable(),
});

const formSchema = z.object({
  texts: z.array(editableTextSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface EditableTextWithFormId extends EditableText {
  formId: string;
  description?: string;
  page_group?: string;
  content_default?: string | null;
}

interface GroupedTexts {
  [key: string]: EditableTextWithFormId[];
}

// Define las secciones principales del sitio
const SITE_SECTIONS = {
  'landing': 'Página Principal',
  'header': 'Encabezado',
  'footer': 'Pie de Página',
  'auth': 'Autenticación',
  'properties': 'Propiedades',
  'requests': 'Solicitudes',
  'profile': 'Perfil de Usuario',
  'admin': 'Administración',
  'notifications': 'Notificaciones',
  'errors': 'Páginas de Error',
  'buttons': 'Botones Comunes',
  'forms': 'Formularios',
  'global': 'Textos Globales'
};

export default function AdminContentPage() {
  const { toast } = useToast();
  const [texts, setTexts] = useState<EditableTextWithFormId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { texts: [] },
  });

  const { control, reset, getValues, setValue } = form;

  useEffect(() => {
    loadTexts();
  }, []);

  async function loadTexts() {
    setIsLoading(true);
    try {
      const fetchedTexts = await getEditableTextsAction();
      const textsWithFormId = fetchedTexts.map(text => ({
        ...text,
        formId: `text-form-${text.id}`,
        description: getTextDescription(text.id),
        page_group: text.page_path || 'global'
      }));
      setTexts(textsWithFormId);
      reset({
        texts: textsWithFormId.map(t => ({
          id: t.id,
          content_current: t.content_current || t.content_default || ''
        }))
      });
    } catch (error) {
      console.error("Error al cargar textos:", error);
      toast({
        title: "Error al cargar textos",
        description: "No se pudieron cargar los textos editables. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Función para generar descripciones amigables basadas en el ID
  function getTextDescription(id: string): string {
    const parts = id.split(':');
    if (parts.length > 1) {
      const section = parts[0];
      const key = parts.slice(1).join(':');
      
      // Mapping de IDs en inglés a descripciones en español
      const spanishDescriptions: Record<string, string> = {
        // Landing
        'hero-title': 'Título Principal',
        'hero-subtitle': 'Subtítulo Principal',
        'hero-search-button': 'Botón de Búsqueda Principal',
        'hero-requests-button': 'Botón de Solicitudes Principal',
        'featured-listings-title': 'Título de Propiedades Destacadas',
        'featured-listings-description': 'Descripción de Propiedades Destacadas',
        'tab-properties': 'Pestaña de Propiedades',
        'tab-requests': 'Pestaña de Solicitudes',
        'no-properties': 'Mensaje Sin Propiedades',
        'no-requests': 'Mensaje Sin Solicitudes',
        'view-all-properties': 'Botón Ver Todas las Propiedades',
        'view-all-requests': 'Botón Ver Todas las Solicitudes',
        'ai-matching-title': 'Título de Búsqueda con IA',
        'ai-matching-description': 'Descripción de Búsqueda con IA',
        'ai-search-label': 'Etiqueta de Búsqueda con IA',
        'ai-search-button': 'Botón de Búsqueda con IA',
        'ai-searching-button': 'Botón de Búsqueda en Proceso',
        'ai-results-title': 'Título de Resultados de IA',
        'ai-results-subtitle': 'Subtítulo de Resultados de IA',
        'ai-view-details': 'Botón Ver Detalles',
        'ai-no-results': 'Mensaje Sin Resultados de IA',
        'ai-error-title': 'Título de Error de IA',
        'whatsbot-title': 'Título de WhatsBot',
        'whatsbot-description': 'Descripción de WhatsBot',
        'plans-title': 'Título de Planes',
        'plans-subtitle': 'Subtítulo de Planes',
        
        // Admin
        'content-title': 'Título de Gestión de Contenido',
        'dashboard-title': 'Título del Panel',
        'properties-title': 'Título de Propiedades',
        'requests-title': 'Título de Solicitudes',
        'settings-title': 'Título de Configuración',
        'users-title': 'Título de Usuarios',
        
        // Auth
        'login-title': 'Título de Inicio de Sesión',
        'login-subtitle': 'Subtítulo de Inicio de Sesión',
        'register-title': 'Título de Registro',
        'register-subtitle': 'Subtítulo de Registro',
        'forgot-password': 'Texto Olvidé Contraseña',
        
        // Buttons
        'save': 'Botón Guardar',
        'cancel': 'Botón Cancelar',
        'edit': 'Botón Editar',
        'delete': 'Botón Eliminar',
        'create': 'Botón Crear',
        'search': 'Botón Buscar',
        'filter': 'Botón Filtrar',
        
        // Forms
        'name-label': 'Etiqueta Nombre',
        'email-label': 'Etiqueta Correo',
        'password-label': 'Etiqueta Contraseña',
        'address-label': 'Etiqueta Dirección',
        'city-label': 'Etiqueta Ciudad',
        'region-label': 'Etiqueta Región',
      };
      
      // Si hay una descripción en español, usarla
      if (spanishDescriptions[key]) {
        return spanishDescriptions[key];
      }
      
      // Si no, transformar el key en una descripción legible
      return key
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return id.replace(/-/g, ' ').replace(/_/g, ' ');
  }

  const handleSaveText = async (textId: string, textIndex: number) => {
    setIsSaving(prev => ({ ...prev, [textId]: true }));
    
    const currentTextValue = getValues(`texts.${textIndex}.content_current`);

    try {
      const result = await updateEditableTextAction(textId, currentTextValue ?? '');

      if (result.success) {
        toast({ title: "Contenido Actualizado", description: result.message });
        // Actualizar el estado local
        setTexts(prev => prev.map(t => 
          t.id === textId ? {...t, content_current: currentTextValue ?? null } : t
        ));
      } else {
        toast({ 
          title: "Error al Guardar", 
          description: result.message, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el contenido.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [textId]: false }));
    }
  };

  // Filtrar textos por término de búsqueda
  const filteredTexts = texts.filter(text => {
    const searchLower = searchTerm.toLowerCase();
    return (
      text.id.toLowerCase().includes(searchLower) ||
      (text.description?.toLowerCase().includes(searchLower)) ||
      (text.content_current?.toLowerCase().includes(searchLower)) ||
      (text.page_path?.toLowerCase().includes(searchLower))
    );
  });

  // Agrupar textos por sección
  const groupedTexts = filteredTexts.reduce((acc, text) => {
    const section = text.page_path || 'global';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(text);
    return acc;
  }, {} as GroupedTexts);

  // Filtrar por tab activo
  const sectionKeys = activeTab === 'all' 
    ? Object.keys(groupedTexts)
    : Object.keys(groupedTexts).filter(key => key === activeTab);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando contenido editable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center">
                <Newspaper className="h-6 w-6 mr-2 text-primary" /> Gestión de Contenido del Sitio
              </CardTitle>
              <CardDescription>
                Edita los textos de las diferentes secciones del sitio web.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadTexts}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Recargar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda */}
          <div className="relative mb-6">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar textos por ID, descripción o contenido..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs para filtrar por sección */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="flex flex-wrap h-auto p-1">
              <TabsTrigger value="all" className="flex items-center gap-1">
                Todos <Badge variant="outline">{texts.length}</Badge>
              </TabsTrigger>
              {Object.entries(SITE_SECTIONS).map(([key, label]) => {
                const count = texts.filter(t => t.page_path === key).length;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                    {label} <Badge variant="outline">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {sectionKeys.length > 0 ? (
            <Accordion type="multiple" defaultValue={sectionKeys} className="w-full">
              {sectionKeys.map((section) => (
                <AccordionItem value={section} key={section}>
                  <AccordionTrigger className="text-lg font-semibold capitalize hover:no-underline">
                    {SITE_SECTIONS[section as keyof typeof SITE_SECTIONS] || section.replace(/_/g, ' ')} 
                    <Badge variant="outline" className="ml-2">
                      {groupedTexts[section].length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedTexts[section].map((textItem, index) => {
                        // Encontrar el índice correcto en el array `texts` del formulario
                        const formTextIndex = form.getValues('texts').findIndex(ft => ft.id === textItem.id);
                        if (formTextIndex === -1) return null;

                        return (
                          <Card key={textItem.id} className="bg-secondary/10 hover:bg-secondary/20 transition-colors">
                            <CardHeader className="pb-2 pt-3 px-4">
                              <CardTitle className="text-md font-medium">
                                {textItem.description || textItem.id.split(':').pop()}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                ID: <code className="bg-muted px-1 py-0.5 rounded-sm">{textItem.id}</code>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <Form {...form}>
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveText(textItem.id, formTextIndex); }} className="space-y-3">
                                  <FormField
                                    control={control}
                                    name={`texts.${formTextIndex}.content_current`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="sr-only">Contenido</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            rows={3}
                                            className="text-sm bg-background resize-y min-h-[80px]"
                                            placeholder="Ingresa el contenido aquí..."
                                            value={field.value ?? ''}
                                            onChange={(e) => setValue(`texts.${formTextIndex}.content_current`, e.target.value)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end">
                                    <Button 
                                      type="submit" 
                                      size="sm" 
                                      disabled={isSaving[textItem.id]}
                                      className="w-full sm:w-auto"
                                    >
                                      {isSaving[textItem.id] ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                          Guardando...
                                        </>
                                      ) : (
                                        <>
                                          <Save className="mr-2 h-4 w-4" /> 
                                          Guardar
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 mb-3 text-gray-400" />
              <p className="text-lg font-medium">
                {searchTerm ? 'No se encontraron textos que coincidan con tu búsqueda.' : 'No hay textos editables configurados.'}
              </p>
              <p className="text-sm mt-1">
                {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Los textos editables deben ser añadidos al script `scripts/setup-db.ts`.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-secondary/10">
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Utiliza la <strong>barra de búsqueda</strong> para encontrar rápidamente textos específicos.</p>
          <p>2. Filtra por <strong>secciones</strong> usando las pestañas en la parte superior.</p>
          <p>3. Haz clic en cada sección para expandir y ver los textos que contiene.</p>
          <p>4. Edita el texto en el área de texto y haz clic en <strong>Guardar</strong> para aplicar los cambios.</p>
          <p>5. Los cambios se aplicarán inmediatamente, pero pueden tardar unos momentos en reflejarse en el sitio debido al caché.</p>
          <p className="mt-4 pt-2 border-t border-border">Para añadir nuevos textos editables, estos deben ser definidos en el script de configuración de la base de datos con un ID único, page_path y descripción.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para mostrar una tarjeta editable
function EditableTextCard({ text }: { text: EditableText }) {
  const titleLabel = text.id.includes(':') 
    ? getTextDescription(text.id) 
    : text.id.replace(/-/g, ' ').replace(/_/g, ' ');
  
  // Extraer el ID sin el prefijo de sección
  const idParts = text.id.split(':');
  const displayId = idParts.length > 1 ? idParts.slice(1).join(':') : text.id;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h3 className="font-medium text-lg mb-1">{titleLabel}</h3>
      <div className="text-sm text-muted-foreground mb-3">
        ID: <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{text.id}</span>
      </div>
      <textarea
        className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Ingresa el contenido aquí..."
        defaultValue={text.content || ''}
        id={`text-${text.id}`}
      ></textarea>
      <div className="flex justify-end mt-3">
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center"
          onClick={() => saveText(text.id)}
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar
        </Button>
      </div>
    </div>
  );
}

// Componente para la sección de administración
function AdminSection({ section, texts }: { section: string; texts: EditableText[] }) {
  const sectionTitle = SITE_SECTIONS[section as keyof typeof SITE_SECTIONS] || section;
  const count = texts.length;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          {sectionTitle} <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm">{count}</span>
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => toggleSection(section)}
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          Mostrar/Ocultar
        </Button>
      </div>
      <div id={`section-${section}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {texts.map((text) => (
          <EditableTextCard key={text.id} text={text} />
        ))}
      </div>
    </div>
  );
}
