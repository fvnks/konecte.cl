
// src/components/admin/requests/AdminEditRequestForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { adminUpdateRequestAction } from '@/actions/requestActions';
import type { PropertyType, ListingCategory, SearchRequest, RequestFormValues } from "@/lib/types"; // Import RequestFormValues
import { requestFormSchema } from "@/lib/types"; // Import requestFormSchema
import { Loader2, Save, Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import React from 'react';

// Reutilizamos las opciones y el esquema del formulario de creación
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

interface AdminEditRequestFormProps {
  request: SearchRequest;
}

export default function AdminEditRequestForm({ request }: AdminEditRequestFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: request.title || "",
      description: request.description || "",
      desiredPropertyType: request.desiredPropertyType || [],
      desiredCategories: request.desiredCategories || [],
      desiredLocationCity: request.desiredLocation?.city || "",
      desiredLocationRegion: request.desiredLocation?.region || "",
      desiredLocationNeighborhood: request.desiredLocation?.neighborhood || "",
      minBedrooms: request.minBedrooms !== undefined ? request.minBedrooms : '',
      minBathrooms: request.minBathrooms !== undefined ? request.minBathrooms : '',
      budgetMax: request.budgetMax !== undefined ? request.budgetMax : '',
      open_for_broker_collaboration: request.open_for_broker_collaboration || false,
    },
  });

  async function onSubmit(values: RequestFormValues) {
    const dataToSubmit = {
        ...values,
        minBedrooms: values.minBedrooms === '' ? undefined : values.minBedrooms,
        minBathrooms: values.minBathrooms === '' ? undefined : values.minBathrooms,
        budgetMax: values.budgetMax === '' ? undefined : values.budgetMax,
    };

    const result = await adminUpdateRequestAction(request.id, dataToSubmit);
    if (result.success) {
      toast({
        title: "Solicitud Actualizada",
        description: "Los detalles de la solicitud han sido actualizados exitosamente.",
      });
      router.push('/admin/requests'); 
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar la solicitud. Intenta de nuevo.",
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
                <Input placeholder="Ej: Busco departamento..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Detallada</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe qué buscas..." className="min-h-[100px]" {...field} />
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
              <FormLabel className="text-base">Tipo de Transacción Buscada</FormLabel>
              {propertyTypeOptions.map((item) => (
                <FormField
                  key={item.value}
                  control={form.control}
                  name="desiredPropertyType"
                  render={({ field }) => {
                    return (
                      <FormItem key={item.value} className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.value])
                                : field.onChange((field.value || []).filter((value) => value !== item.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
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
              <FormLabel className="text-base">Categorías de Propiedad Deseadas</FormLabel>
               {categoryOptions.map((item) => (
                <FormField
                  key={item.value}
                  control={form.control}
                  name="desiredCategories"
                  render={({ field }) => {
                    return (
                      <FormItem key={item.value} className="flex flex-row items-center space-x-3 space-y-0 mb-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.value])
                                : field.onChange((field.value || []).filter((value) => value !== item.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
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
                name="desiredLocationRegion"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Región Deseada</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: V Región de Valparaíso" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
            control={form.control}
            name="desiredLocationCity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ciudad/Comuna Deseada</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Santiago" {...field} />
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
                <FormLabel>Barrio/Sector (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Providencia" {...field} />
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
                <FormLabel>Mín. Dormitorios</FormLabel>
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
                <FormLabel>Mín. Baños</FormLabel>
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
                <FormLabel>Presupuesto Máx.</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 600000" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="open_for_broker_collaboration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-medium flex items-center">
                  <Handshake className="h-5 w-5 mr-2 text-primary"/>
                  Abierta a Colaboración de Corredores
                </FormLabel>
                <FormDescription>
                  Permite que otros corredores vean esta solicitud y propongan propiedades.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
                Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
        </div>
      </form>
    </Form>
  );
}
