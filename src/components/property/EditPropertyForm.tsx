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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { PropertyType, ListingCategory, PropertyListing, PropertyFormValues, SubmitPropertyResult, OrientationType } from "@/lib/types";
import { propertyFormSchema, orientationValues } from '@/lib/types';
import { Loader2, Save, UploadCloud, Trash2, Home, Bath, Car, Dog, Sofa, Building, Warehouse, Compass, BedDouble, GripVertical, Move } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, ChangeEvent, useEffect } from 'react';
import Image from "next/image";
import { cn } from "@/lib/utils";
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
// import useHasMounted from '@/hooks/useHasMounted'; // No longer needed due to dynamic import of parent

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

const orientationOptions: { value: OrientationType; label: string }[] = [
  { value: "north", label: "Norte" },
  { value: "south", label: "Sur" },
  { value: "east", label: "Este" },
  { value: "west", label: "Oeste" },
  { value: "northeast", label: "Nororiente" },
  { value: "northwest", label: "Norponiente" },
  { value: "southeast", label: "Suroriente" },
  { value: "southwest", label: "Surponiente" },
  { value: "other", label: "Otra" },
  { value: "none", label: "No especificada" },
];

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

const editPropertyFormSchema = propertyFormSchema; 
type EditPropertyFormValues = z.infer<typeof editPropertyFormSchema>;

interface EditPropertyFormProps {
  property: PropertyListing;
  userId?: string;
  onSubmitAction: (
    propertyId: string,
    data: PropertyFormValues,
    userId?: string 
  ) => Promise<SubmitPropertyResult>;
  isAdminContext?: boolean;
}

interface ManagedImage {
  id: string;
  url: string;
  file?: File;
  isNew: boolean;
}

export default function EditPropertyForm({ property, userId, onSubmitAction, isAdminContext = false }: EditPropertyFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [managedImages, setManagedImages] = useState<ManagedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // const hasMounted = useHasMounted(); // Removed

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
      bedrooms: property.bedrooms === 0 ? '' : (property.bedrooms ?? ''),
      bathrooms: property.bathrooms === 0 ? '' : (property.bathrooms ?? ''),
      totalAreaSqMeters: property.totalAreaSqMeters || 0,
      usefulAreaSqMeters: property.usefulAreaSqMeters === 0 || property.usefulAreaSqMeters === null ? '' : (property.usefulAreaSqMeters ?? undefined),
      parkingSpaces: property.parkingSpaces === 0 ? '' : (property.parkingSpaces ?? ''),
      petsAllowed: property.petsAllowed || false,
      furnished: property.furnished || false,
      commercialUseAllowed: property.commercialUseAllowed || false,
      hasStorage: property.hasStorage || false,
      orientation: property.orientation || "none",
      images: property.images || [],
      features: property.features?.join(', ') || "",
    },
  });

  const watchedPropertyType = form.watch("propertyType");
  const watchedCategory = form.watch("category");

  useEffect(() => {
    const initialManagedImages = (property.images || []).map((imgUrl, index) => ({
      id: `existing-${imgUrl.slice(-10)}-${index}`,
      url: imgUrl,
      isNew: false,
    }));
    setManagedImages(initialManagedImages);
  }, [property.images]);

  useEffect(() => {
    // Update form value when managedImages changes
    form.setValue('images', managedImages.map(img => img.url), { shouldValidate: true, shouldDirty: true });
  }, [managedImages, form]);


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImageCount = managedImages.length;
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

      const newManagedImagesFromFile = validFiles.map(file => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: previewUrl,
          url: previewUrl,
          file: file,
          isNew: true as const,
        };
      });
      setManagedImages(prev => [...prev, ...newManagedImagesFromFile]);
      event.target.value = '';
    }
  };

  const removeImage = (idToRemove: string) => {
    setManagedImages(prev => {
      const imageToRemove = prev.find(img => img.id === idToRemove);
      if (imageToRemove?.isNew && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== idToRemove);
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setManagedImages(prev => {
      const items = Array.from(prev);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, reorderedItem);
      return items;
    });
  };

  async function onSubmit(values: EditPropertyFormValues) {
    const finalImageUrlsForServer: string[] = [];
    setIsUploading(true);

    for (const img of managedImages) {
      if (img.isNew && img.file) {
        const formData = new FormData();
        formData.append("imageFile", img.file);
        try {
          const response = await fetch('/api/upload-image-to-cpanel', { method: 'POST', body: formData });
          const result = await response.json();
          if (response.ok && result.success && result.url) {
            finalImageUrlsForServer.push(result.url);
          } else {
            toast({ title: "Error de Subida Parcial", description: `No se pudo subir ${img.file.name}: ${result.message || 'Error desconocido'}`, variant: "warning" });
          }
        } catch (error: any) {
          toast({ title: "Error de Subida", description: `No se pudo subir ${img.file.name}. Error: ${error.message}`, variant: "destructive" });
        }
      } else if (!img.isNew) {
        finalImageUrlsForServer.push(img.url);
      }
    }
    setIsUploading(false);

    const dataToSubmit: PropertyFormValues = {
      ...values,
      images: finalImageUrlsForServer,
      bedrooms: values.bedrooms === '' ? 0 : Number(values.bedrooms),
      bathrooms: values.bathrooms === '' ? 0 : Number(values.bathrooms),
      parkingSpaces: values.parkingSpaces === '' ? 0 : Number(values.parkingSpaces),
      usefulAreaSqMeters: values.usefulAreaSqMeters === '' || values.usefulAreaSqMeters === undefined || values.usefulAreaSqMeters === null
                            ? undefined
                            : Number(values.usefulAreaSqMeters),
      orientation: values.orientation === 'none' || values.orientation === '' ? undefined : values.orientation,
    };

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
      managedImages.forEach(img => {
        if (img.isNew && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [managedImages]);

  const showPetsAllowed = watchedPropertyType === 'rent' && (watchedCategory === 'apartment' || watchedCategory === 'house');
  const showFurnished = watchedPropertyType === 'rent' && (watchedCategory === 'house' || watchedCategory === 'apartment');
  const showCommercialUse = (watchedPropertyType === 'rent' || watchedPropertyType === 'sale') && (watchedCategory === 'house' || watchedCategory === 'land' || watchedCategory === 'commercial');
  const showStorage = (watchedPropertyType === 'rent' || watchedPropertyType === 'sale') && watchedCategory === 'apartment';

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
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue="CLP">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                    <SelectItem value="UF">UF (Unidad de Fomento)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección Completa</FormLabel> <FormControl><AddressAutocompleteInput value={field.value} onChange={(address, details) => { field.onChange(address); if (details?.city) form.setValue('city', details.city, { shouldValidate: true }); if (details?.country) form.setValue('country', details.country, { shouldValidate: true }); }} placeholder="Comienza a escribir la dirección..." disabled={form.formState.isSubmitting} /></FormControl> <FormDescription>Ingresa la dirección. Las sugerencias aparecerán mientras escribes.</FormDescription> <FormMessage /> </FormItem> )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad/Comuna</FormLabel> <FormControl><Input placeholder="Ej: Valparaíso (se autocompletará si es posible)" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input placeholder="Ej: Chile (se autocompletará si es posible)" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="totalAreaSqMeters" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary"/>Superficie Total (m²)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 120" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="usefulAreaSqMeters" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary"/>Superficie Útil (m²) (Opcional)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 100" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="bedrooms" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><BedDouble className="mr-2 h-4 w-4 text-primary"/>N° de Dormitorios</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="bathrooms" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Bath className="mr-2 h-4 w-4 text-primary"/>N° de Baños</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="parkingSpaces" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary"/>N° Estacionamientos</FormLabel> <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="orientation" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Compass className="mr-2 h-4 w-4 text-primary"/>Orientación</FormLabel> <Select onValueChange={field.onChange} value={field.value || "none"}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona orientación" /> </SelectTrigger></FormControl> <SelectContent> {orientationOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        <div className="space-y-4 pt-2">
            <FormLabel className="text-base font-medium">Otras Características</FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {showPetsAllowed && <FormField control={form.control} name="petsAllowed" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/50 transition-colors"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <FormLabel className="font-normal flex items-center"><Dog className="mr-2 h-5 w-5 text-primary"/>Se Aceptan Mascotas</FormLabel> </FormItem> )}/>}
                {showFurnished && <FormField control={form.control} name="furnished" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/50 transition-colors"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <FormLabel className="font-normal flex items-center"><Sofa className="mr-2 h-5 w-5 text-primary"/>Amoblado</FormLabel> </FormItem> )}/>}
                {showCommercialUse && <FormField control={form.control} name="commercialUseAllowed" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/50 transition-colors"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <FormLabel className="font-normal flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/>Permite Uso Comercial</FormLabel> </FormItem> )}/>}
                {showStorage && <FormField control={form.control} name="hasStorage" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/50 transition-colors"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <FormLabel className="font-normal flex items-center"><Warehouse className="mr-2 h-5 w-5 text-primary"/>Tiene Bodega</FormLabel> </FormItem> )}/>}
            </div>
             { !showPetsAllowed && !showFurnished && !showCommercialUse && !showStorage && watchedPropertyType && watchedCategory &&
                <p className="text-sm text-muted-foreground italic">No hay características adicionales aplicables para el tipo y categoría de propiedad seleccionada.</p>
              }
        </div>
        <FormField
          control={form.control}
          name="images"
          render={() => {
            const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
            return (
              <FormItem id={formItemId}>
                <FormLabel>Imágenes de la Propiedad (Máx. {MAX_IMAGES})</FormLabel>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="imageDroppableEdit" direction="horizontal" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="mb-4 flex gap-3 overflow-x-auto py-2"
                        >
                          {managedImages.map((managedImage, index) => (
                            <Draggable key={managedImage.id} draggableId={managedImage.id} index={index}>
                              {(providedDraggable, snapshot) => (
                                <div
                                  ref={providedDraggable.innerRef}
                                  {...providedDraggable.draggableProps}
                                  {...providedDraggable.dragHandleProps}
                                  className={cn(
                                    "relative group w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 border rounded-lg overflow-hidden shadow-sm bg-slate-100",
                                    snapshot.isDragging && "ring-2 ring-primary shadow-xl"
                                  )}
                                >
                                  <Image src={managedImage.url} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md z-10" onClick={() => removeImage(managedImage.id)} disabled={isUploading} aria-label="Eliminar imagen" > <Trash2 className="h-3.5 w-3.5" /> </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                {managedImages.length < MAX_IMAGES && (
                  <label
                    htmlFor="image-upload-input-edit"
                    className={cn(
                      "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      "bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground/50",
                      (isUploading || (managedImages.length >= MAX_IMAGES)) && "cursor-not-allowed opacity-70",
                      error && "border-destructive"
                    )}
                    aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
                    aria-invalid={!!error}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-1 text-base text-muted-foreground">
                        <span className="font-semibold text-primary">Añadir más imágenes</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Máx. {MAX_IMAGES - managedImages.length} más (hasta {MAX_FILE_SIZE_MB}MB c/u)
                      </p>
                    </div>
                    <Input
                      id="image-upload-input-edit"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleImageChange}
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      disabled={managedImages.length >= MAX_IMAGES || isUploading}
                    />
                  </label>
                )}
                <FormDescription id={formDescriptionId}>Puedes reemplazar, añadir o reordenar imágenes. Las imágenes existentes se mantendrán a menos que las elimines.</FormDescription>
                {isUploading && ( <div className="flex items-center mt-3 text-sm text-primary"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo nuevas imágenes... </div> )}
                <FormMessage id={formMessageId} />
              </FormItem>
            );
          }}
        />
        <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <FormControl><Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /></FormControl> <FormDescription>Lista características importantes de la propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting || isUploading}>
                Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
              {(form.formState.isSubmitting || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isUploading ? 'Subiendo...' : 'Guardar Cambios'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
