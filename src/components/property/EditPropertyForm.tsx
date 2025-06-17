
// src/components/property/EditPropertyForm.tsx
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
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { PropertyType, ListingCategory, PropertyListing, PropertyFormValues, SubmitPropertyResult } from "@/lib/types";
import { Loader2, Save, UploadCloud, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, ChangeEvent, useEffect } from 'react';
import Image from "next/image";
import { cn } from "@/lib/utils";
import { propertyFormSchema } from '@/lib/types'; // Importar el schema original

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

// El schema para el formulario de edición
// Puede ser el mismo que el de creación si los campos son idénticos,
// o ajustado si hay diferencias (ej. slug no editable, user_id se toma de sesión)
// Aquí reutilizaremos propertyFormSchema para los campos editables.
const editPropertyFormSchema = propertyFormSchema; // o una versión modificada
type EditPropertyFormValues = z.infer<typeof editPropertyFormSchema>;

interface EditPropertyFormProps {
  property: PropertyListing;
  userId?: string; // ID del usuario, requerido si es una edición de usuario
  // La acción de submit ahora se pasa como prop
  onSubmitAction: (
    propertyId: string, 
    data: PropertyFormValues, 
    userId?: string // userId es opcional para la acción de admin, pero requerido para la acción de usuario
  ) => Promise<SubmitPropertyResult>;
  isAdminContext?: boolean; // Para saber si se usa en contexto de admin
}

export default function EditPropertyForm({ property, userId, onSubmitAction, isAdminContext = false }: EditPropertyFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(property.images || []); // Init with existing images
  const [isUploading, setIsUploading] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(property.images || []);


  const form = useForm<EditPropertyFormValues>({
    resolver: zodResolver(editPropertyFormSchema),
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
      images: property.images || [], // Mantener las URLs existentes inicialmente
      features: property.features?.join(', ') || "",
    },
  });

  useEffect(() => {
    // Sincronizar las imágenes existentes con imagePreviews y existingImageUrls
    setImagePreviews(property.images || []);
    setExistingImageUrls(property.images || []);
    form.setValue('images', property.images || [], { shouldValidate: true });
  }, [property.images, form]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImageCount = imagePreviews.length;
      const availableSlots = MAX_IMAGES - currentImageCount;

      if (filesArray.length > availableSlots) {
        toast({ title: "Límite Excedido", description: `Máximo ${MAX_IMAGES} imágenes. Ya tienes ${currentImageCount}, puedes añadir ${availableSlots} más.`, variant: "warning" });
      }

      const validFiles = filesArray.slice(0, availableSlots).filter(file => {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast({ title: "Archivo Demasiado Grande", description: `"${file.name}" excede ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
          return false;
        }
        return true;
      });

      setImageFiles(prevFiles => [...prevFiles, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      
      // Update react-hook-form images field with all current previews (existing + new)
      form.setValue('images', [...existingImageUrls, ...newPreviews], { shouldValidate: true, shouldDirty: true });
      event.target.value = ''; 
    }
  };

  const removeImage = (indexToRemove: number, isExisting: boolean) => {
    if (isExisting) {
      const urlToRemove = existingImageUrls[indexToRemove];
      setExistingImageUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
      setImagePreviews(prev => prev.filter(url => url !== urlToRemove));
       // Actualizar RHF images
      form.setValue('images', existingImageUrls.filter((_, index) => index !== indexToRemove), { shouldValidate: true, shouldDirty: true });
    } else {
      // Adjust indexToRemove for newly added files based on existingImageUrls.length
      const actualFileIndex = indexToRemove - existingImageUrls.length;
      setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== actualFileIndex));
      const newPreviews = [...imagePreviews];
      const removedUrl = newPreviews.splice(indexToRemove, 1)[0];
      if (removedUrl) URL.revokeObjectURL(removedUrl);
      setImagePreviews(newPreviews);
       // Actualizar RHF images
      form.setValue('images', newPreviews, { shouldValidate: true, shouldDirty: true });
    }
  };

  const uploadNewImagesToProxy = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("imageFile", file);
      try {
        const response = await fetch('/api/upload-image-to-cpanel', { method: 'POST', body: formData });
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


  async function onSubmit(values: EditPropertyFormValues) {
    const newlyUploadedUrls = await uploadNewImagesToProxy();
    const finalImageUrls = [...existingImageUrls, ...newlyUploadedUrls];

    // Ensure data passed to action matches PropertyFormValues
    const dataToSubmit: PropertyFormValues = {
      ...values,
      images: finalImageUrls,
    };

    // For admin context, userId is not needed for the action itself
    // For user context, userId is passed to verify ownership
    const result = await onSubmitAction(property.id, dataToSubmit, isAdminContext ? undefined : userId);
    
    if (result.success) {
      toast({
        title: "Propiedad Actualizada",
        description: "Los detalles de la propiedad han sido actualizados exitosamente.",
      });
      router.push(isAdminContext ? '/admin/properties' : '/dashboard/my-listings'); 
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar la propiedad. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }
  
  useEffect(() => {
    return () => {
      // Revoke Object URLs for newly added previews when component unmounts
      imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Título de la Publicación</FormLabel> <FormControl><Input placeholder="Ej: Lindo departamento con vista al mar en Concón" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción Detallada</FormLabel> <FormControl><Textarea placeholder="Describe tu propiedad en detalle..." className="min-h-[120px]" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Transacción</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona arriendo o venta" /> </SelectTrigger></FormControl> <SelectContent> {propertyTypeOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría de Propiedad</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona una categoría" /> </SelectTrigger></FormControl> <SelectContent> {categoryOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Precio</FormLabel> <FormControl><Input type="number" placeholder="Ej: 85000000" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="currency" render={({ field }) => ( <FormItem> <FormLabel>Moneda</FormLabel> <FormControl><Input placeholder="Ej: CLP, UF, USD" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección Completa</FormLabel> <FormControl><Input placeholder="Ej: Av. Siempre Viva 742, Villa Alemana" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad/Comuna</FormLabel> <FormControl><Input placeholder="Ej: Valparaíso" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input placeholder="Ej: Chile" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="bedrooms" render={({ field }) => ( <FormItem> <FormLabel>N° de Dormitorios</FormLabel> <FormControl><Input type="number" placeholder="Ej: 3" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="bathrooms" render={({ field }) => ( <FormItem> <FormLabel>N° de Baños</FormLabel> <FormControl><Input type="number" placeholder="Ej: 2" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="areaSqMeters" render={({ field }) => ( <FormItem> <FormLabel>Superficie (m²)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 120" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => {
            const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
            return (
              <FormItem id={formItemId}>
                <FormLabel>Imágenes de la Propiedad (Máx. {MAX_IMAGES})</FormLabel>
                <label htmlFor="image-upload-input-actual" className={cn( "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors", "bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground/50", isUploading && "cursor-not-allowed opacity-70", error && "border-destructive" )} aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`} aria-invalid={!!error} >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-1 text-base text-muted-foreground"> <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta nuevas imágenes </p>
                    <p className="text-xs text-muted-foreground"> PNG, JPG, GIF, WEBP (Máx. {MAX_IMAGES} en total, hasta {MAX_FILE_SIZE_MB}MB c/u) </p>
                    <p className="text-xs text-muted-foreground mt-1">Imágenes actuales: {imagePreviews.length} de {MAX_IMAGES}</p>
                  </div>
                  <Input id="image-upload-input-actual" type="file" className="hidden" multiple onChange={handleImageChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={imagePreviews.length >= MAX_IMAGES || isUploading} />
                </label>
                <FormDescription id={formDescriptionId}>Puedes reemplazar o añadir imágenes. Las imágenes existentes se mantendrán a menos que las elimines.</FormDescription>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imagePreviews.map((previewUrl, index) => {
                      const isExisting = existingImageUrls.includes(previewUrl);
                      return (
                        <div key={previewUrl + index} className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100">
                          <Image src={previewUrl} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md" onClick={() => removeImage(index, isExisting)} disabled={isUploading} aria-label="Eliminar imagen" > <Trash2 className="h-4 w-4" /> </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isUploading && ( <div className="flex items-center mt-3 text-sm text-primary"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo nuevas imágenes... </div> )}
                <FormMessage id={formMessageId} />
              </FormItem>
            );
          }}
        />

        <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <FormControl><Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /></FormControl> <FormDescription>Lista características importantes de la propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting || isUploading}> Cancelar </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
              {(form.formState.isSubmitting || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isUploading ? 'Subiendo...' : 'Guardar Cambios'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

