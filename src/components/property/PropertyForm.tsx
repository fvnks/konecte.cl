
// src/components/property/PropertyForm.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitPropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory, User as StoredUser } from "@/lib/types";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/types"; // Importar schema y tipo
import { Loader2, UserCircle, UploadCloud, Image as ImageIcon, Trash2 } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Importar Next Image

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

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export default function PropertyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      currency: "CLP",
      address: "",
      city: "",
      country: "Chile",
      bedrooms: 0,
      bathrooms: 0,
      areaSqMeters: 0,
      images: [], // Inicializar como array vacío
      features: "",
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const newTotalImages = imageFiles.length + filesArray.length;

      if (newTotalImages > MAX_IMAGES) {
        toast({
          title: "Límite de Imágenes Alcanzado",
          description: `Solo puedes subir un máximo de ${MAX_IMAGES} imágenes.`,
          variant: "destructive",
        });
        return;
      }

      const validFiles = filesArray.filter(file => {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast({
            title: "Archivo Demasiado Grande",
            description: `La imagen "${file.name}" excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      setImageFiles(prevFiles => [...prevFiles, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    setUploadedImageUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
  };

  const uploadImagesToProxy = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    const cpanelUploadEndpoint = process.env.NEXT_PUBLIC_CPANEL_UPLOAD_ENDPOINT;

    if (!cpanelUploadEndpoint) {
      toast({ title: "Error de Configuración", description: "El endpoint de subida no está configurado.", variant: "destructive" });
      setIsUploading(false);
      return [];
    }

    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("imageFile", file); // El script PHP esperará "imageFile"

      try {
        const response = await fetch('/api/upload-image-to-cpanel', { // API Route en Next.js
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          throw new Error(result.message || `Error al subir ${file.name}`);
        }
      } catch (error: any) {
        toast({ title: "Error de Subida", description: error.message || `No se pudo subir ${file.name}.`, variant: "destructive" });
        // Continuar con las otras imágenes
      }
    }
    setIsUploading(false);
    return uploadedUrls;
  };


  async function onSubmit(values: PropertyFormValues) {
    if (!loggedInUser || !loggedInUser.id) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para publicar.", variant: "destructive" });
      return;
    }

    const finalImageUrls = await uploadImagesToProxy();
    if (imageFiles.length > 0 && finalImageUrls.length === 0 && !confirm("Algunas imágenes no pudieron subirse. ¿Deseas continuar sin ellas?")) {
        return; // No continuar si el usuario cancela y hubo errores de subida
    }
    
    const dataToSubmit = {
      ...values,
      images: finalImageUrls, // Usar las URLs del servidor cPanel
    };

    const result = await submitPropertyAction(dataToSubmit, loggedInUser.id);
    if (result.success && result.propertyId) {
      toast({
        title: result.autoMatchesCount && result.autoMatchesCount > 0 ? "¡Propiedad Publicada y Matches Encontrados!" : "Propiedad Publicada",
        description: result.message || "Tu propiedad ha sido enviada exitosamente.",
        duration: result.autoMatchesCount && result.autoMatchesCount > 0 ? 7000 : 5000,
      });
      form.reset();
      setImageFiles([]);
      setImagePreviews([]);
      setUploadedImageUrls([]);
      if (result.propertySlug) {
        router.push(`/properties/${result.propertySlug}`);
      } else {
        router.push('/properties');
      }
    } else {
      toast({ title: "Error al Publicar", description: result.message || "No se pudo enviar tu propiedad.", variant: "destructive" });
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
                </FormLabel>
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
        
        {/* Image Upload Section */}
        <FormItem>
          <FormLabel>Imágenes de la Propiedad (Máx. {MAX_IMAGES}, hasta {MAX_FILE_SIZE_MB}MB c/u)</FormLabel>
          <FormControl>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (Máx. {MAX_FILE_SIZE_MB}MB)</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handleImageChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={imageFiles.length >= MAX_IMAGES || isUploading} />
                </label>
            </div>
          </FormControl>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative group aspect-square border rounded-md overflow-hidden">
                  <Image src={previewUrl} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    disabled={isUploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {isUploading && (
            <div className="flex items-center mt-2 text-sm text-primary">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo imágenes... ({uploadedImageUrls.length + 1 > imageFiles.length ? imageFiles.length : uploadedImageUrls.length + 1} de {imageFiles.length})
            </div>
          )}
          <FormMessage />
        </FormItem>


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
        
        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || isCheckingAuth || !loggedInUser || isUploading}>
          {(form.formState.isSubmitting || isCheckingAuth || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Subiendo imágenes...' : 'Publicar Propiedad'}
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

