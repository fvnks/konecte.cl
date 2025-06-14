
// src/app/admin/content/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { EditableText } from '@/lib/types';
import { getEditableTextsAction, updateEditableTextAction } from '@/actions/editableTextActions';
import { Loader2, Save, Newspaper, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const editableTextSchema = z.object({
  id: z.string(),
  content_current: z.string().max(5000, "El contenido no puede exceder los 5000 caracteres.").nullable(),
});

const formSchema = z.object({
  texts: z.array(editableTextSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface EditableTextWithFormId extends EditableText {
  formId: string; // Para el ID del formulario individual
}

interface GroupedTexts {
  [key: string]: EditableTextWithFormId[];
}

export default function AdminContentPage() {
  const { toast } = useToast();
  const [texts, setTexts] = useState<EditableTextWithFormId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({}); // Para rastrear el estado de guardado por ID

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { texts: [] },
  });

  const { control, reset, getValues, setValue } = form;
  
  // No necesitamos useFieldArray si manejamos formularios individuales

  useEffect(() => {
    async function loadTexts() {
      setIsLoading(true);
      const fetchedTexts = await getEditableTextsAction();
      const textsWithFormId = fetchedTexts.map(text => ({ ...text, formId: `text-form-${text.id}`}));
      setTexts(textsWithFormId);
      reset({ texts: textsWithFormId.map(t => ({ id: t.id, content_current: t.content_current || t.content_default || '' })) });
      setIsLoading(false);
    }
    loadTexts();
  }, [reset]);

  const handleSaveText = async (textId: string, textIndex: number) => {
    setIsSaving(prev => ({ ...prev, [textId]: true }));
    
    const currentTextValue = getValues(`texts.${textIndex}.content_current`);

    const result = await updateEditableTextAction(textId, currentTextValue ?? '');

    if (result.success) {
      toast({ title: "Contenido Actualizado", description: result.message });
      // Actualizar el estado local para reflejar el cambio guardado
      setTexts(prev => prev.map(t => t.id === textId ? {...t, content_current: currentTextValue } : t));
    } else {
      toast({ title: "Error al Guardar", description: result.message, variant: "destructive" });
      // Si falla, podríamos revertir el valor en el formulario al original de `texts` state.
      // Pero por ahora, solo mostramos el error.
    }
    setIsSaving(prev => ({ ...prev, [textId]: false }));
  };

  const groupedTexts = texts.reduce((acc, text) => {
    const group = text.page_group || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(text);
    return acc;
  }, {} as GroupedTexts);

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
          <CardTitle className="text-2xl font-headline flex items-center">
            <Newspaper className="h-6 w-6 mr-2 text-primary" /> Gestión de Contenido del Sitio
          </CardTitle>
          <CardDescription>
            Edita los textos clave de las diferentes secciones de tu sitio web. Los cambios se reflejarán una vez guardados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedTexts).length > 0 ? (
            <Accordion type="multiple" defaultValue={Object.keys(groupedTexts)} className="w-full">
              {Object.entries(groupedTexts).map(([groupName, textList]) => (
                <AccordionItem value={groupName} key={groupName}>
                  <AccordionTrigger className="text-lg font-semibold capitalize hover:no-underline">
                    {groupName.replace(/_/g, ' ')} ({textList.length})
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <div className="space-y-6">
                      {textList.map((textItem, index) => {
                        // Encontrar el índice correcto en el array `texts` del formulario
                        const formTextIndex = form.getValues('texts').findIndex(ft => ft.id === textItem.id);
                        if (formTextIndex === -1) return null; // Seguridad, aunque no debería pasar

                        return (
                          <Card key={textItem.id} className="bg-secondary/30">
                            <CardHeader className="pb-3 pt-4 px-4">
                              <CardTitle className="text-md font-medium">{textItem.description}</CardTitle>
                              <CardDescription className="text-xs">ID: <code className="bg-muted px-1 py-0.5 rounded-sm">{textItem.id}</code></CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <Form {...form}> {/* Podríamos tener un form por cada item, pero manejamos el submit individualmente */}
                                <form onSubmit={(e) => { e.preventDefault(); handleSaveText(textItem.id, formTextIndex); }} className="space-y-3">
                                  <FormField
                                    control={control}
                                    name={`texts.${formTextIndex}.content_current`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="sr-only">Contenido Actual</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            rows={3}
                                            className="text-sm bg-background"
                                            placeholder="Ingresa el contenido aquí..."
                                            value={field.value ?? ''} // Asegurar que no sea null
                                            onChange={(e) => setValue(`texts.${formTextIndex}.content_current`, e.target.value)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button type="submit" size="sm" disabled={isSaving[textItem.id]}>
                                    {isSaving[textItem.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Guardar
                                  </Button>
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
              <p className="text-lg font-medium">No hay textos editables configurados.</p>
              <p className="text-sm mt-1">Los textos editables deben ser añadidos al script `scripts/setup-db.ts`.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-6 bg-secondary/30">
        <CardHeader>
            <CardTitle className="text-lg">Notas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Los cambios guardados aquí pueden tardar unos momentos en reflejarse en el sitio público debido al caché o revalidación de rutas.</p>
            <p>Para añadir nuevos textos editables, estos deben ser definidos primero en el script de configuración de la base de datos (`scripts/setup-db.ts`) con un `id` único, `page_group`, `description` y opcionalmente un `content_default`.</p>
            <p>Los campos `content_current` son los que se mostrarán en el sitio. Si están vacíos, se intentará usar `content_default` (si la lógica de la página lo implementa).</p>
        </CardContent>
      </Card>
    </div>
  );
}
