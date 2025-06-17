
// src/components/property/PropertyForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  // FormControl, // No longer needed for the images field
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField, 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitPropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory, User as StoredUser, PropertyFormValues } from "@/lib/types";
import { propertyFormSchema } from "@/lib/types";
import { Loader2, UserCircle, UploadCloud, Trash2 } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      price: undefined,
      currency: "CLP",
      address: "",
      city: "",
      country: "Chile",
      bedrooms: 0,
      bathrooms: 0,
      areaSqMeters: undefined,
      images: [], 
      features: "",
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImageCount = imagePreviews.length;
      const availableSlots = MAX_IMAGES - currentImageCount;

      if (filesArray.length > availableSlots) {
        toast({
          title: "Límite de Imágenes Excedido",
          description: `Solo puedes subir ${availableSlots} imagen(es) más (máximo ${MAX_IMAGES}).`,
          variant: "destructive",
        });
      }

      const validFiles = filesArray.slice(0, availableSlots).filter(file => {
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
      
      // Update react-hook-form state for 'images' field
      // This is important for validation to work correctly with the custom input
      // We'll update it with the current array of preview URLs (or file names, or file count)
      // Since schema expects string[], URLs are appropriate if they become available after upload
      // For now, let's use the number of files to trigger validation state.
      // The actual URLs will be set in onSubmit.
      form.setValue('images', [...imagePreviews, ...newPreviews], { shouldValidate: true, shouldDirty: true });
      
      event.target.value = ''; 
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prevPreviews => {
      const newPreviews = [...prevPreviews];
      const removedUrl = newPreviews.splice(indexToRemove, 1)[0];
      if (removedUrl) {
        URL.revokeObjectURL(removedUrl);
      }
      // Update react-hook-form state after removal
      form.setValue('images', newPreviews, { shouldValidate: true, shouldDirty: true });
      return newPreviews;
    });
  };

  const uploadImagesToProxy = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("imageFile", file);

      try {
        const response = await fetch('/api/upload-image-to-cpanel', {
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
    
    const dataToSubmit = {
      ...values,
      images: finalImageUrls, 
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
      if (result.propertySlug) {
        router.push(`/properties/${result.propertySlug}`);
      } else {
        router.push('/properties');
      }
    } else {
      toast({ title: "Error al Publicar", description: result.message || "No se pudo enviar tu propiedad.", variant: "destructive" });
    }
  }
  
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]); 
  
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
        {/* Standard Fields using FormControl */}
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Título de la Publicación</FormLabel> <Input placeholder="Ej: Lindo departamento con vista al mar en Concón" {...field} /> <FormDescription>Un título atractivo y descriptivo para tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción Detallada</FormLabel> <Textarea placeholder="Describe tu propiedad en detalle..." className="min-h-[120px]" {...field} /> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Transacción</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <Input type="hidden" {...field} /> <SelectTrigger> <SelectValue placeholder="Selecciona arriendo o venta" /> </SelectTrigger> <SelectContent> {propertyTypeOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría de Propiedad</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <Input type="hidden" {...field} /> <SelectTrigger> <SelectValue placeholder="Selecciona una categoría" /> </SelectTrigger> <SelectContent> {categoryOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Precio</FormLabel> <Input type="number" placeholder="Ej: 85000000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="currency" render={({ field }) => ( <FormItem> <FormLabel>Moneda</FormLabel> <Input placeholder="Ej: CLP, UF, USD" {...field} /> <FormDescription>Código de 3 letras para la moneda.</FormDescription> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección Completa</FormLabel> <Input placeholder="Ej: Av. Siempre Viva 742, Villa Alemana" {...field} /> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad/Comuna</FormLabel> <Input placeholder="Ej: Valparaíso" {...field} /> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <Input placeholder="Ej: Chile" {...field} /> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="bedrooms" render={({ field }) => ( <FormItem> <FormLabel>N° de Dormitorios</FormLabel> <Input type="number" placeholder="Ej: 3" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} /> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="bathrooms" render={({ field }) => ( <FormItem> <FormLabel>N° de Baños</FormLabel> <Input type="number" placeholder="Ej: 2" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} /> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="areaSqMeters" render={({ field }) => ( <FormItem> <FormLabel>Superficie (m²)</FormLabel> <Input type="number" placeholder="Ej: 120" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /> <FormMessage /> </FormItem> )}/>
        </div>
        
        {/* Custom Image Upload Field - Bypassing FormControl */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => { // RHF field passed here, but we control value/onChange customly
            const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
            return (
              <FormItem id={formItemId}>
                <FormLabel>Imágenes de la Propiedad (Máx. {MAX_IMAGES})</FormLabel>
                {/* Main interactive element for the custom input */}
                <label
                  htmlFor="image-upload-input-actual"
                  className={cn(
                    "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    "bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground/50",
                    isUploading && "cursor-not-allowed opacity-70",
                    error && "border-destructive" // Add error styling if RHF signals an error
                  )}
                  aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
                  aria-invalid={!!error}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-1 text-base text-muted-foreground">
                      <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Imágenes (Máx. {MAX_IMAGES}, hasta {MAX_FILE_SIZE_MB}MB c/u)
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP</p>
                    <p className="text-xs text-muted-foreground mt-1">Imágenes subidas: {imagePreviews.length} de {MAX_IMAGES}</p>
                  </div>
                  <Input // Actual hidden file input
                    id="image-upload-input-actual"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                        handleImageChange(e);
                        // Trigger RHF validation when files change
                        // We're using form.setValue for images in handleImageChange now
                    }}
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    disabled={imagePreviews.length >= MAX_IMAGES || isUploading}
                  />
                </label>
                <FormDescription id={formDescriptionId}>Sube imágenes claras y de buena calidad de tu propiedad.</FormDescription>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((previewUrl, index) => (
                      <div key={previewUrl} className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100">
                        <Image src={previewUrl} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md"
                          onClick={() => removeImage(index)}
                          disabled={isUploading}
                          aria-label="Eliminar imagen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {isUploading && (
                  <div className="flex items-center mt-3 text-sm text-primary">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo imágenes...
                  </div>
                )}
                <FormMessage id={formMessageId} />
              </FormItem>
            );
          }}
        />

        <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /> <FormDescription>Lista características importantes de tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
        
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
