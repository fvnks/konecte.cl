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
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { submitPropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory, User as StoredUser, PropertyFormValues, OrientationType } from "@/lib/types";
import { propertyFormSchema, orientationValues } from "@/lib/types";
import { Loader2, UploadCloud, Trash2, Home, Bath, Car, Dog, Sofa, Building, Warehouse, Compass, BedDouble, GripVertical, Move } from "lucide-react";
import { useEffect, useState, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AuthRequiredDialog from '@/components/auth/AuthRequiredDialog';
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';

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

interface ManagedImage {
  id: string;
  url: string;
  file: File;
  isNew: true;
}

export default function PropertyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mounted, setMounted] = useState(false); // For react-beautiful-dnd

  const [managedImages, setManagedImages] = useState<ManagedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);

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
      bedrooms: '',
      bathrooms: '',
      totalAreaSqMeters: undefined,
      usefulAreaSqMeters: '',
      parkingSpaces: '',
      petsAllowed: false,
      furnished: false,
      commercialUseAllowed: false,
      hasStorage: false,
      orientation: "none",
      images: [],
      features: "",
      propertyType: undefined,
      category: undefined,
    },
  });
  
  const watchedPropertyType = form.watch("propertyType");
  const watchedCategory = form.watch("category");

  useEffect(() => {
    setMounted(true); // Ensure dnd components render only on client after mount
    console.log("[PropertyForm] Auth Check Effect: Start");
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser = JSON.parse(userJson);
        setLoggedInUser(parsedUser);
        console.log("[PropertyForm] Auth Check Effect: User found in localStorage", parsedUser);
      } catch (error) {
        console.error("[PropertyForm] Auth Check Effect: Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);
      }
    } else {
      console.log("[PropertyForm] Auth Check Effect: No user found in localStorage.");
      setLoggedInUser(null);
    }
    setIsCheckingAuth(false);
    console.log("[PropertyForm] Auth Check Effect: Finished. isCheckingAuth = false");
  }, []);
  
  useEffect(() => {
    form.setValue('images', managedImages.map(img => img.url), { shouldValidate: true, shouldDirty: true });
  }, [managedImages, form]);


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentImageCount = managedImages.length;
      const availableSlots = MAX_IMAGES - currentImageCount;

      if (filesArray.length > availableSlots) {
        toast({
          title: "Límite de Imágenes Excedido",
          description: `Solo puedes subir ${availableSlots} imagen(es) más (máximo ${MAX_IMAGES}).`,
          variant: "warning",
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
      if (imageToRemove?.url.startsWith('blob:')) {
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

  const uploadImagesToProxy = async (): Promise<string[]> => {
    const filesToUpload = managedImages.map(img => img.file);
    if (filesToUpload.length === 0) return [];
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
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

  const onSubmitLogic = async (values: PropertyFormValues) => {
    const finalImageUrls = await uploadImagesToProxy();
    
    const dataToSubmit = {
      ...values,
      images: finalImageUrls,
      bedrooms: values.bedrooms === '' ? 0 : Number(values.bedrooms),
      bathrooms: values.bathrooms === '' ? 0 : Number(values.bathrooms),
      parkingSpaces: values.parkingSpaces === '' ? 0 : Number(values.parkingSpaces),
      usefulAreaSqMeters: values.usefulAreaSqMeters === '' || values.usefulAreaSqMeters === undefined || values.usefulAreaSqMeters === null
                          ? undefined
                          : Number(values.usefulAreaSqMeters),
      orientation: values.orientation === 'none' || values.orientation === '' ? undefined : values.orientation,
    };
    const result = await submitPropertyAction(dataToSubmit, loggedInUser!.id); // User ID is checked before this is called

    if (result.success && result.propertyId) {
      toast({
        title: result.autoMatchesCount && result.autoMatchesCount > 0 ? "¡Propiedad Publicada y Matches Encontrados!" : "Propiedad Publicada",
        description: result.message || "Tu propiedad ha sido enviada exitosamente.",
        duration: result.autoMatchesCount && result.autoMatchesCount > 0 ? 7000 : 5000,
      });
      form.reset();
      setManagedImages([]);
      if (result.propertySlug) {
        router.push(`/properties/${result.propertySlug}`);
      } else {
        router.push('/properties');
      }
    } else {
      toast({ title: "Error al Publicar", description: result.message || "No se pudo enviar tu propiedad.", variant: "destructive" });
    }
  };

  const handleAttemptToPublish = () => {
    console.log("[PropertyForm] handleAttemptToPublish: Clicked. isCheckingAuth:", isCheckingAuth, "loggedInUser:", !!loggedInUser);
    if (isCheckingAuth) {
      toast({ title: "Verificando sesión...", description: "Por favor espera un momento." });
      return;
    }
    if (!loggedInUser || !loggedInUser.id) {
      console.log("[PropertyForm] handleAttemptToPublish: User not logged in, setShowAuthAlert(true)");
      setShowAuthAlert(true);
      return;
    }
    console.log("[PropertyForm] handleAttemptToPublish: User logged in, calling form.handleSubmit.");
    form.handleSubmit(onSubmitLogic)();
  };

  useEffect(() => {
    return () => {
      managedImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
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
    <>
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handleAttemptToPublish(); }} className="space-y-8">
          <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Título de la Publicación</FormLabel> <FormControl><Input placeholder="Ej: Lindo departamento con vista al mar en Concón" {...field} /></FormControl> <FormDescription>Un título atractivo y descriptivo para tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción Detallada</FormLabel> <FormControl><Textarea placeholder="Describe tu propiedad en detalle..." className="min-h-[120px]" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Transacción</FormLabel> <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona arriendo o venta" /> </SelectTrigger></FormControl> <SelectContent> {propertyTypeOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría de Propiedad</FormLabel> <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona una categoría" /> </SelectTrigger></FormControl> <SelectContent> {categoryOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Precio</FormLabel> <FormControl><Input type="number" placeholder="Ej: 85000000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
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
          <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección Completa</FormLabel> <FormControl><AddressAutocompleteInput value={field.value} onChange={(address, details) => { field.onChange(address); if (details?.city) form.setValue('city', details.city, { shouldValidate: true }); if (details?.country) form.setValue('country', details.country, { shouldValidate: true }); }} placeholder="Comienza a escribir la dirección..." disabled={form.formState.isSubmitting || isCheckingAuth} /></FormControl> <FormDescription>Ingresa la dirección. Las sugerencias aparecerán mientras escribes.</FormDescription> <FormMessage /> </FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad/Comuna</FormLabel> <FormControl><Input placeholder="Ej: Valparaíso (se autocompletará si es posible)" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input placeholder="Ej: Chile (se autocompletará si es posible)" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="totalAreaSqMeters" render={({ field }) => ( <FormItem> <FormLabel className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary"/>Superficie Total (m²)</FormLabel> <FormControl><Input type="number" placeholder="Ej: 120" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
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
            render={({ field }) => { 
              const { formItemId, formDescriptionId, formMessageId, error } = useFormField();
              return (
                <FormItem id={formItemId}>
                  <FormLabel>Imágenes de la Propiedad (Máx. {MAX_IMAGES})</FormLabel>
                  {mounted && (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="imageDroppableForm" direction="horizontal" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="mb-4" 
                          >
                            {managedImages.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {managedImages.map((managedImage, index) => (
                                  <Draggable key={managedImage.id} draggableId={managedImage.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          "relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100",
                                          snapshot.isDragging && "ring-2 ring-primary shadow-xl"
                                        )}
                                      >
                                        <button type="button" {...provided.dragHandleProps} className="absolute top-1 left-1 z-20 p-1 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" aria-label="Mover imagen" title="Arrastrar para reordenar" > <Move className="h-3.5 w-3.5" /> </button>
                                        <Image src={managedImage.url} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md z-10" onClick={() => removeImage(managedImage.id)} disabled={isUploading} aria-label="Eliminar imagen" > <Trash2 className="h-4 w-4" /> </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                  {!mounted && <div className="text-sm text-muted-foreground">Cargando controles de imagen...</div>}
                  {managedImages.length < MAX_IMAGES && (
                    <label
                      htmlFor="image-upload-input-create"
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
                          <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Imágenes (Máx. {MAX_IMAGES - managedImages.length} más)
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (hasta {MAX_FILE_SIZE_MB}MB c/u)</p>
                      </div>
                      <Input
                        id="image-upload-input-create"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleImageChange}
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        disabled={managedImages.length >= MAX_IMAGES || isUploading}
                      />
                    </label>
                  )}
                  <FormDescription id={formDescriptionId}>Sube imágenes claras y de buena calidad. Puedes arrastrarlas para cambiar el orden (la primera será la principal).</FormDescription>
                  {isUploading && ( <div className="flex items-center mt-3 text-sm text-primary"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo imágenes... </div> )}
                  <FormMessage id={formMessageId} />
                </FormItem>
              );
            }}
          />
          <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <FormControl><Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /></FormControl> <FormDescription>Lista características importantes de tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
          
          <Button 
            type="button" 
            onClick={handleAttemptToPublish}
            className="w-full md:w-auto" 
            disabled={form.formState.isSubmitting || isUploading || isCheckingAuth}
          >
            {(form.formState.isSubmitting || isUploading || isCheckingAuth) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCheckingAuth ? 'Verificando...' : (isUploading ? 'Subiendo imágenes...' : 'Publicar Propiedad')}
          </Button>
        </form>
      </Form>
      <AuthRequiredDialog
        open={showAuthAlert}
        onOpenChange={setShowAuthAlert}
        redirectPath="/properties/submit"
      />
    </>
  );
}
