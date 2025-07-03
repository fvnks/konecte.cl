'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { EditableText } from '@/lib/types';
import { getEditableTextsAction, updateEditableTextAction } from '@/actions/editableTextActions';
import { Loader2, Save, Newspaper, Search, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// --- Tipos y Constantes ---

interface EditableTextWithMeta extends EditableText {
  description: string;
}

const SITE_SECTIONS: Record<string, string> = {
  'landing': 'Página Principal',
  'header': 'Encabezado',
  'footer': 'Pie de Página',
  'auth': 'Autenticación',
  'properties': 'Páiedades',
  'requests': 'Solicitudes',
  'profile': 'Perfil de Usuario',
  'admin': 'Administración',
  'notifications': 'Notificaciones',
  'errors': 'Páginas de Error',
  'buttons': 'Botones Comunes',
  'forms': 'Formularios',
  'global': 'Textos Globales'
};

// --- Componente de Tarjeta de Texto Editable (con su propia lógica) ---

function EditableTextEntry({ text, onSave }: { text: EditableTextWithMeta, onSave: (id: string, newContent: string) => Promise<void> }) {
  const [content, setContent] = useState(text.content_current ?? text.content_default ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const hasChanged = content !== (text.content_current ?? text.content_default ?? '');

  const handleSave = async () => {
    if (!hasChanged) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      await onSave(text.id, content);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000); // Muestra feedback por 2s
    } catch (error) {
      // El error ya se maneja en el padre, aquí solo actualizamos UI
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/20 p-4 border-b">
        <CardTitle className="text-base font-semibold flex justify-between items-center">
          <span>{text.description}</span>
          <Badge variant="outline" className="font-mono text-xs">{text.id}</Badge>
        </CardTitle>
        {text.content_default && (
          <p className="text-sm text-muted-foreground pt-2 italic">
            Original: "{text.content_default}"
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={text.content_default || "Introduce el texto aquí..."}
          className="text-base"
          rows={3}
        />
      </CardContent>
      <CardFooter className="bg-muted/20 p-3 flex justify-end items-center space-x-3">
        {isSaved && <CheckCircle className="h-5 w-5 text-green-500 transition-opacity" />}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasChanged}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Componente Principal de la Página ---

export default function AdminContentPage() {
  const [allTexts, setAllTexts] = useState<EditableTextWithMeta[]>([]);
  const [filteredTexts, setFilteredTexts] = useState<EditableTextWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const getTextDescription = useCallback((id: string): string => {
    const key = id.includes(':') ? id.split(':').slice(1).join(':') : id;
    const spanishDescriptions: Record<string, string> = {
        'hero-title': 'Título Principal', 'hero-subtitle': 'Subtítulo Principal', 'featured-listings-title': 'Título de Propiedades Destacadas',
        'ai-matching-title': 'Título de Búsqueda con IA', 'plans-title': 'Título de Planes', 'login-title': 'Título de Inicio de Sesión',
        'register-title': 'Título de Registro', 'save': 'Botón Guardar',
    };
    if (spanishDescriptions[key]) return spanishDescriptions[key];
    return key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, []);

  const loadTexts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTexts = await getEditableTextsAction();
      const textsWithMeta = fetchedTexts.map(text => ({
        ...text,
        description: getTextDescription(text.id),
      }));
      setAllTexts(textsWithMeta);
      setFilteredTexts(textsWithMeta);
    } catch (error) {
      console.error("Error al cargar textos:", error);
      toast({ title: "Error al Cargar", description: "No se pudieron cargar los textos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [getTextDescription, toast]);

  useEffect(() => {
    loadTexts();
  }, [loadTexts]);

  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const result = allTexts.filter(text =>
      text.id.toLowerCase().includes(lowerCaseSearch) ||
      text.description.toLowerCase().includes(lowerCaseSearch) ||
      (text.content_current ?? '').toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredTexts(result);
  }, [searchTerm, allTexts]);
  
  const handleSave = async (id: string, newContent: string) => {
    try {
      const result = await updateEditableTextAction(id, newContent);
      if (result.success) {
        toast({ title: "Éxito", description: `"${getTextDescription(id)}" ha sido actualizado.` });
        setAllTexts(prev => prev.map(t => t.id === id ? { ...t, content_current: newContent } : t));
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message || "Ocurrió un error inesperado.", variant: "destructive" });
      throw error;
    }
  };

  const groupedTexts = filteredTexts.reduce((acc, text) => {
    const groupKey = text.page_path || 'global';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(text);
    return acc;
  }, {} as Record<string, EditableTextWithMeta[]>);

  const sortedGroupKeys = Object.keys(groupedTexts).sort((a, b) => {
    const order = Object.keys(SITE_SECTIONS);
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB) || a.localeCompare(b);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Cargando contenido...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Newspaper className="h-6 w-6 mr-3" />Gestión de Contenido</CardTitle>
          <CardDescription>Edita los textos de la web. Los cambios se guardan de forma individual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, descripción o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button variant="outline" onClick={loadTexts} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Recargar
            </Button>
          </div>

          {filteredTexts.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <p className="text-lg font-medium text-muted-foreground">No se encontraron textos</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? `Tu búsqueda de "${searchTerm}" no arrojó resultados.` : 'No hay textos para mostrar.'}
              </p>
              {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')}>Limpiar búsqueda</Button>}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={sortedGroupKeys} className="w-full">
              {sortedGroupKeys.map((groupKey) => (
                <AccordionItem value={groupKey} key={groupKey}>
                  <AccordionTrigger className="text-xl font-medium hover:no-underline px-4 rounded-md hover:bg-muted/50">
                    <div className="flex items-center">
                      <span className="mr-3">{SITE_SECTIONS[groupKey] || groupKey}</span>
                      <Badge variant="secondary">{groupedTexts[groupKey].length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-0 grid gap-4 md:grid-cols-2">
                    {groupedTexts[groupKey].map((text) => (
                      <EditableTextEntry key={text.id} text={text} onSave={handleSave} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 