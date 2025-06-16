
// src/components/admin/properties/AdminEditPropertyForm.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminUpdatePropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory, PropertyListing } from "@/lib/types";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation"; // For redirecting after successful edit
import React from 'react';

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

// El schema principal ahora espera `images` como `string[]`.
// Para el admin, permitiremos editarlo como un string separado por comas,
// y lo convertiremos antes de enviarlo a la acción.
const adminPropertyFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  propertyType: z.enum(["rent", "sale"], { required_error: "Debes seleccionar un tipo de propiedad (arriendo/venta)." }),
  category: z.enum(["apartment", "house", "condo", "land", "commercial", "other"], { required_error: "Debes seleccionar una categoría." }),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  currency: z.string().min(3, "La moneda debe tener 3 caracteres (ej: CLP, USD).").max(3, "La moneda debe tener 3 caracteres (ej: CLP, USD).").toUpperCase(),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(2, "La ciudad es requerida."),
  country: z.string().min(2, "El país es requerido."),
  bedrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "El número de dormitorios no puede ser negativo."),
  bathrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "El número de baños no puede ser negativo."),
  areaSqMeters: z.coerce.number().positive("El área (m²) debe ser un número positivo."),
  imagesString: z.string().optional().describe("URLs de imágenes separadas por comas."), // Campo para el Textarea
  features: z.string().optional().describe("Características separadas por comas."),
});

type AdminPropertyFormValues = z.infer<typeof adminPropertyFormSchema>;


interface AdminEditPropertyFormProps {
  property: PropertyListing;
}

export default function AdminEditPropertyForm({ property }: AdminEditPropertyFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AdminPropertyFormValues>({
    resolver: zodResolver(adminPropertyFormSchema),
    defaultValues: {
      title: property.title || "",
      description: property.description || "",
      propertyType: property.propertyType,
      category: property.category,
      price: property.price || 0,
      currency: property.currency || "CLP",
      address: property.address || "",
      city: property.city || "",
      country: property.country || "Chile",
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      areaSqMeters: property.areaSqMeters || 0,
      imagesString: property.images?.join(', ') || "", // Convert array to comma-separated string for Textarea
      features: property.features?.join(', ') || "",
    },
  });

  async function onSubmit(values: AdminPropertyFormValues) {
    const imagesArray = values.imagesString ? values.imagesString.split(',').map(img => img.trim()).filter(img => img.length > 0 && /^https?:\/\//.test(img)) : [];
    
    const dataToSubmit = {
        ...values,
        images: imagesArray, // Ahora 'images' es string[]
    };
    // Quitar imagesString ya que no es parte de PropertyFormValues que espera adminUpdatePropertyAction
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imagesString, ...finalData } = dataToSubmit;


    const result = await adminUpdatePropertyAction(property.id, finalData);
    if (result.success) {
      toast({
        title: "Propiedad Actualizada",
        description: "Los detalles de la propiedad han sido actualizados exitosamente.",
      });
      router.push('/admin/properties'); 
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar la propiedad. Intenta de nuevo.",
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
              <FormLabel>Título de la Publicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Lindo departamento con vista al mar en Concón" {...field} />
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
                <Textarea placeholder="Describe tu propiedad en detalle..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Transacción</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona arriendo o venta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {propertyTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría de Propiedad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 85000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: CLP, UF, USD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección Completa</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Av. Siempre Viva 742, Villa Alemana" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad/Comuna</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Valparaíso" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Chile" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de Dormitorios</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de Baños</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="areaSqMeters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Superficie (m²)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 120" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="imagesString"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URLs de Imágenes (separadas por comas)</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: https://placehold.co/600x400.png,https://placehold.co/600x400.png" {...field} className="min-h-[80px]" />
              </FormControl>
              <FormDescription>Pega las URLs de las imágenes de la propiedad, separadas por una coma. Asegúrate que sean URLs válidas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Características Adicionales (separadas por comas)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} />
              </FormControl>
              <FormDescription>Lista características importantes de la propiedad.</FormDescription>
              <FormMessage />
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

