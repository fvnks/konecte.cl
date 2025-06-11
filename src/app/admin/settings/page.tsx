// src/app/admin/settings/page.tsx
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
import { saveGoogleSheetConfigAction, getGoogleSheetConfigAction } from "@/actions/googleSheetActions";
import type { GoogleSheetConfig } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  sheetId: z.string().min(1, "El ID de la Hoja de Cálculo es requerido."),
  sheetName: z.string().min(1, "El nombre de la Hoja (pestaña) es requerido."),
  columnsToDisplay: z.string().min(1, "Debe especificar los nombres de los encabezados de las columnas a mostrar (ej: Nombre,Email)."),
});

type GoogleSheetFormValues = z.infer<typeof formSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [initialConfig, setInitialConfig] = useState<Partial<GoogleSheetConfig>>({});

  const form = useForm<GoogleSheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sheetId: "",
      sheetName: "",
      columnsToDisplay: "",
    },
  });

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      const config = await getGoogleSheetConfigAction();
      if (config && config.isConfigured) {
        form.reset({
          sheetId: config.sheetId,
          sheetName: config.sheetName,
          columnsToDisplay: config.columnsToDisplay,
        });
        setInitialConfig(config);
      } else if (config) {
         form.reset({
          sheetId: config.sheetId || "",
          sheetName: config.sheetName || "",
          columnsToDisplay: config.columnsToDisplay || "",
        });
         setInitialConfig(config);
      }
      setIsLoading(false);
    }
    loadConfig();
  }, [form]);

  async function onSubmit(values: GoogleSheetFormValues) {
    const result = await saveGoogleSheetConfigAction({ ...values, isConfigured: true });
    if (result.success) {
      toast({
        title: "Configuración Guardada",
        description: "La configuración de Google Sheets se ha guardado correctamente.",
      });
      setInitialConfig({...values, isConfigured: true});
    } else {
      toast({
        title: "Error",
        description: result.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Configuración de Google Sheets</CardTitle>
        <CardDescription>
          Configura el ID de la Hoja de Cálculo de Google, el nombre de la hoja (pestaña) y las columnas que deseas mostrar.
          La hoja de cálculo debe estar compartida como "Cualquier persona con el enlace puede ver".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="sheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID de la Hoja de Cálculo de Google</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1qA2bC3dE4fG5hI6jK7lM8nO9pQrStUvWxYzAbCdEfGhI" {...field} />
                  </FormControl>
                  <FormDescription>
                    El ID largo que se encuentra en la URL de tu Google Sheet (entre /d/ y /edit).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sheetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Hoja (Pestaña)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Hoja1 o Clientes" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre exacto de la pestaña dentro de tu Hoja de Cálculo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="columnsToDisplay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Columnas a Mostrar (Nombres de Encabezado)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Nombre,Email,Teléfono" {...field} />
                  </FormControl>
                  <FormDescription>
                    Escribe los nombres exactos de los encabezados de las columnas de tu hoja (separados por comas) que deseas mostrar. El orden se respetará. La primera fila de tu hoja se considerará como los encabezados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar Configuración
            </Button>
          </form>
        </Form>
        {initialConfig.isConfigured && (
          <div className="mt-8 p-4 border rounded-md bg-secondary/30">
            <h4 className="font-semibold">Configuración Actual:</h4>
            <p className="text-sm"><strong>Sheet ID:</strong> {initialConfig.sheetId}</p>
            <p className="text-sm"><strong>Nombre de Hoja:</strong> {initialConfig.sheetName}</p>
            <p className="text-sm"><strong>Columnas:</strong> {initialConfig.columnsToDisplay}</p>
          </div>
        )}
         <div className="mt-6 p-4 border border-blue-500 bg-blue-50 rounded-md text-blue-700">
            <h4 className="font-semibold text-blue-800">¡Importante!</h4>
            <p className="text-sm">
                Para que esto funcione, tu Hoja de Cálculo de Google debe estar compartida públicamente:
            </p>
            <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                <li>Abre tu Google Sheet.</li>
                <li>Haz clic en "Archivo" &gt; "Compartir" &gt; "Publicar en la web".</li>
                <li>En la pestaña "Enlace", asegúrate de que "Toda la hoja de cálculo" (o la hoja específica) esté seleccionada y elige "Valores separados por comas (.csv)" en el segundo desplegable.</li>
                <li>Haz clic en "Publicar".</li>
                <li>Alternativamente (y preferido para este método), simplemente comparte la hoja con la opción: "Cualquier persona con el enlace" puede "Ver". El ID de la hoja y el nombre de la pestaña serán suficientes.</li>
            </ol>
            <p className="text-sm mt-2">
              La aplicación construirá la URL CSV necesaria automáticamente.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
