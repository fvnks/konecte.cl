
// src/components/request/RequestForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { submitRequestAction } from "@/actions/requestActions";
import type { PropertyType, ListingCategory } from "@/lib/types";
import { Loader2 } from "lucide-react";

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: "rent", label: "Arriendo" },
  { value: "sale", label: "Venta" },
];

const categoryOptions: { value: ListingCategory; label: string }[] = [
  { value: "apartment", label: "Departamento" },
  { value: "house", label: "Casa" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "other", label: "Otro" },
];

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  desiredPropertyType: z.array(z.enum(["rent", "sale"])).min(1, "Debes seleccionar al menos un tipo de transacción (arriendo/venta)."),
  desiredCategories: z.array(z.enum(["apartment", "house", "condo", "land", "commercial", "other"])).min(1, "Debes seleccionar al menos una categoría de propiedad."),
  desiredLocationCity: z.string().min(2, "La ciudad/comuna deseada es requerida."),
  desiredLocationNeighborhood: z.string().optional(),
  minBedrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "No puede ser negativo.").optional().or(z.literal('')),
  minBathrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "No puede ser negativo.").optional().or(z.literal('')),
  budgetMax: z.coerce.number().positive("El presupuesto máximo debe ser un número positivo.").optional().or(z.literal('')),
});

export type RequestFormValues = z.infer<typeof formSchema>;

export default function RequestForm() {
  const { toast } = useToast();
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      desiredPropertyType: [],
      desiredCategories: [],
      desiredLocationCity: "",
      desiredLocationNeighborhood: "",
      minBedrooms: undefined,
      minBathrooms: undefined,
      budgetMax: undefined,
    },
  });

  async function onSubmit(values: RequestFormValues) {
    const dataToSubmit = {
        ...values,
        minBedrooms: values.minBedrooms === '' ? undefined : values.minBedrooms,
        minBathrooms: values.minBathrooms === '' ? undefined : values.minBathrooms,
        budgetMax: values.budgetMax === '' ? undefined : values.budgetMax,
    };

    // TODO: Conectar esta acción con la base de datos cuando se implemente el backend para solicitudes.
    // Por ahora, la acción submitRequestAction es simulada y no guarda en la BD.
    const result = await submitRequestAction(dataToSubmit);
    if (result.success) {
      toast({
        title: "Solicitud Publicada (Simulación)",
        description: "Tu solicitud de propiedad ha sido enviada (actualmente es una simulación y no se guarda en la base de datos).",
      });
      form.reset();
    } else {
      toast({
        title: "Error al Publicar Solicitud",
        description: result.message || "No se pudo enviar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la Solicitud</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Busco departamento de 2 dormitorios en Providencia" {...field} />
              </FormControl>
              <FormDescription>Un título claro sobre lo que estás buscando.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Detallada de tu Búsqueda</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe con detalle qué tipo de propiedad buscas, características importantes, etc." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desiredPropertyType"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Tipo de Transacción Buscada</FormLabel>
                <FormDescription>
                  Selecciona si buscas arrendar, comprar, o ambos.
                </FormDescription>
              </div>
              {propertyTypeOptions.map((item) => (
                <FormField
                  key={item.value}
                  control={form.control}
                  name="desiredPropertyType"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.value}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.value])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item.value
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desiredCategories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Categorías de Propiedad Deseadas</FormLabel>
                <FormDescription>
                  Selecciona los tipos de propiedad que te interesan.
                </FormDescription>
              </div>
              {categoryOptions.map((item) => (
                <FormField
                  key={item.value}
                  control={form.control}
                  name="desiredCategories"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.value}
                        className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.value])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item.value
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="desiredLocationCity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ciudad/Comuna Deseada</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Santiago, Viña del Mar" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="desiredLocationNeighborhood"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Barrio/Sector Preferido (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Las Condes, Ñuñoa, Reñaca" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="minBedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mínimo de Dormitorios (Opcional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 2" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minBathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mínimo de Baños (Opcional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presupuesto Máximo (Opcional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 600000 (en CLP)" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </FormControl>
                <FormDescription>Indica tu presupuesto máximo en CLP o UF.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar Solicitud
        </Button>
      </form>
    </Form>
  );
}
