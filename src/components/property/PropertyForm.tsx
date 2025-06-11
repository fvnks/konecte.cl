// src/components/property/PropertyForm.tsx
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
import { submitPropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory } from "@/lib/types";
import { Loader2 } from "lucide-react";

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: "rent", label: "Alquiler" },
  { value: "sale", label: "Venta" },
];

const categoryOptions: { value: ListingCategory; label: string }[] = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "other", label: "Otro" },
];

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  propertyType: z.enum(["rent", "sale"], { required_error: "Debes seleccionar un tipo de propiedad." }),
  category: z.enum(["apartment", "house", "condo", "land", "commercial", "other"], { required_error: "Debes seleccionar una categoría." }),
  price: z.coerce.number().positive("El precio debe ser un número positivo."),
  currency: z.string().min(3, "La moneda debe tener 3 caracteres (ej: USD).").max(3, "La moneda debe tener 3 caracteres (ej: USD).").toUpperCase(),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(2, "La ciudad es requerida."),
  country: z.string().min(2, "El país es requerido."),
  bedrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "El número de habitaciones no puede ser negativo."),
  bathrooms: z.coerce.number().int("Debe ser un número entero.").min(0, "El número de baños no puede ser negativo."),
  areaSqMeters: z.coerce.number().positive("El área debe ser un número positivo."),
  images: z.string().optional().describe("URLs de imágenes separadas por comas. Ejemplo: url1,url2"),
  features: z.string().optional().describe("Características separadas por comas. Ejemplo: Piscina,Garaje"),
});

export type PropertyFormValues = z.infer<typeof formSchema>;

export default function PropertyForm() {
  const { toast } = useToast();
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      currency: "USD",
      address: "",
      city: "",
      country: "",
      bedrooms: 0,
      bathrooms: 0,
      areaSqMeters: 0,
      images: "",
      features: "",
    },
  });

  async function onSubmit(values: PropertyFormValues) {
    const result = await submitPropertyAction(values);
    if (result.success) {
      toast({
        title: "Propiedad Publicada",
        description: "Tu propiedad ha sido enviada exitosamente.",
      });
      form.reset(); // Reset form fields
    } else {
      toast({
        title: "Error al Publicar",
        description: result.message || "No se pudo enviar tu propiedad. Intenta de nuevo.",
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
                <Input placeholder="Ej: Hermoso apartamento con vista al mar" {...field} />
              </FormControl>
              <FormDescription>Un título atractivo y descriptivo para tu propiedad.</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona alquiler o venta" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Input type="number" placeholder="Ej: 250000" {...field} />
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
                  <Input placeholder="Ej: USD, EUR, MXN" {...field} />
                </FormControl>
                <FormDescription>Código de 3 letras para la moneda.</FormDescription>
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
                <Input placeholder="Ej: Calle Falsa 123, Colonia Centro" {...field} />
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
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ciudad de México" {...field} />
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
                  <Input placeholder="Ej: México" {...field} />
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
                <FormLabel>Habitaciones</FormLabel>
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
                <FormLabel>Baños</FormLabel>
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
                <FormLabel>Área (m²)</FormLabel>
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
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URLs de Imágenes (separadas por comas)</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: https://placehold.co/600x400.png,https://placehold.co/600x400.png" {...field} />
              </FormControl>
              <FormDescription>Pega las URLs de las imágenes de tu propiedad, separadas por una coma.</FormDescription>
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
                <Input placeholder="Ej: Piscina, Jardín, Vigilancia 24h" {...field} />
              </FormControl>
              <FormDescription>Lista características importantes de tu propiedad.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar Propiedad
        </Button>
      </form>
    </Form>
  );
}
