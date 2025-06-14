
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
import type { PropertyType, ListingCategory, User as StoredUser } from "@/lib/types"; // Renamed User to StoredUser to avoid conflict
import { Loader2, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link

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
  images: z.string().optional().describe("URLs de imágenes separadas por comas. Ejemplo: url1,url2"),
  features: z.string().optional().describe("Características separadas por comas. Ejemplo: Piscina,Estacionamiento"),
});

export type PropertyFormValues = z.infer<typeof formSchema>;

export default function PropertyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser'); // Clear corrupted data
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      currency: "CLP", // Default to CLP for Chile
      address: "",
      city: "",
      country: "Chile", // Default to Chile
      bedrooms: 0,
      bathrooms: 0,
      areaSqMeters: 0,
      images: "",
      features: "",
    },
  });

  async function onSubmit(values: PropertyFormValues) {
    if (!loggedInUser || !loggedInUser.id) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión para publicar una propiedad.",
        variant: "destructive",
        action: <Button variant="outline" size="sm" onClick={() => router.push('/auth/signin')}>Iniciar Sesión</Button>
      });
      return;
    }

    const result = await submitPropertyAction(values, loggedInUser.id);
    if (result.success && result.propertyId) {
      toast({
        title: result.autoMatchesCount && result.autoMatchesCount > 0 ? "¡Propiedad Publicada y Matches Encontrados!" : "Propiedad Publicada",
        description: result.message || "Tu propiedad ha sido enviada exitosamente.",
        duration: result.autoMatchesCount && result.autoMatchesCount > 0 ? 7000 : 5000,
      });
      form.reset();
      if (result.propertySlug) {
        router.push(`/properties/${result.propertySlug}`);
      } else {
        router.push('/properties');
      }
    } else {
      toast({
        title: "Error al Publicar",
        description: result.message || "No se pudo enviar tu propiedad. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }
  
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Verificando autenticación...</p>
      </div>
    );
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
                <Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} />
              </FormControl>
              <FormDescription>Lista características importantes de tu propiedad.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || isCheckingAuth || !loggedInUser}>
          {(form.formState.isSubmitting || isCheckingAuth) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar Propiedad
        </Button>
        {!isCheckingAuth && !loggedInUser && (
          <p className="text-sm text-destructive text-center mt-2">
            <UserCircle className="inline-block h-4 w-4 mr-1 align-text-bottom" />
            Debes <Link href="/auth/signin" className="underline hover:text-destructive/80">iniciar sesión</Link> o <Link href="/auth/signup" className="underline hover:text-destructive/80">registrarte</Link> para publicar.
          </p>
        )}
      </form>
    </Form>
  );
}
