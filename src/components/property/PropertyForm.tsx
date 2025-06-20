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
import { Loader2, UserCircle, UploadCloud, Trash2, Home, Bath, Car, Dog, Sofa, Building, Warehouse, Compass, BedDouble, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function PropertyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);

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
      bedrooms: '',
      bathrooms: '',
      totalAreaSqMeters: undefined,
      usefulAreaSqMeters: undefined,
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
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión o registrarte para publicar.", variant: "warning" });
      setShowAuthAlert(true);
      return;
    }

    const finalImageUrls = await uploadImagesToProxy();

    const dataToSubmit = {
      ...values,
      images: finalImageUrls,
      usefulAreaSqMeters: values.usefulAreaSqMeters === '' ? undefined : values.usefulAreaSqMeters,
      orientation: values.orientation === 'none' || values.orientation === '' ? undefined : values.orientation,
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

  const showPetsAllowed = watchedPropertyType === 'rent' && (watchedCategory === 'apartment' || watchedCategory === 'house');
  const showFurnished = watchedPropertyType === 'rent' && (watchedCategory === 'house' || watchedCategory === 'apartment');
  const showCommercialUse = (watchedPropertyType === 'rent' || watchedPropertyType === 'sale') && (watchedCategory === 'house' || watchedCategory === 'land' || watchedCategory === 'commercial');
  const showStorage = (watchedPropertyType === 'rent' || watchedPropertyType === 'sale') && watchedCategory === 'apartment';


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Título de la Publicación</FormLabel> <FormControl><Input placeholder="Ej: Lindo departamento con vista al mar en Concón" {...field} /></FormControl> <FormDescription>Un título atractivo y descriptivo para tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción Detallada</FormLabel> <FormControl><Textarea placeholder="Describe tu propiedad en detalle..." className="min-h-[120px]" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Transacción</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona arriendo o venta" /> </SelectTrigger></FormControl> <SelectContent> {propertyTypeOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Categoría de Propiedad</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger> <SelectValue placeholder="Selecciona una categoría" /> </SelectTrigger></FormControl> <SelectContent> {categoryOptions.map(option => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
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
          
          <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Dirección Completa</FormLabel> <FormControl><AddressAutocompleteInput value={field.value} onChange={(address, details) => { field.onChange(address); if (details?.city) form.setValue('city', details.city, { shouldValidate: true }); if (details?.country) form.setValue('country', details.country, { shouldValidate: true }); }} placeholder="Comienza a escribir la dirección..." disabled={form.formState.isSubmitting || !loggedInUser} /></FormControl> <FormDescription>Ingresa la dirección. Las sugerencias aparecerán mientras escribes.</FormDescription> <FormMessage /> </FormItem> )}/>
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
                  <label htmlFor="image-upload-input-actual" className={cn( "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors", "bg-muted/30 hover:bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground/50", isUploading && "cursor-not-allowed opacity-70", error && "border-destructive" )} aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`} aria-invalid={!!error} >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-1 text-base text-muted-foreground"> <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta </p>
                      <p className="text-xs text-muted-foreground"> Imágenes (Máx. {MAX_IMAGES}, hasta {MAX_FILE_SIZE_MB}MB c/u) </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP</p>
                      <p className="text-xs text-muted-foreground mt-1">Imágenes subidas: {imagePreviews.length} de {MAX_IMAGES}</p>
                    </div>
                    <Input id="image-upload-input-actual" type="file" className="hidden" multiple onChange={(e) => { handleImageChange(e); }} accept="image/png, image/jpeg, image/gif, image/webp" disabled={imagePreviews.length >= MAX_IMAGES || isUploading} />
                  </label>
                  <FormDescription id={formDescriptionId}>Sube imágenes claras y de buena calidad de tu propiedad.</FormDescription>
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {imagePreviews.map((previewUrl, index) => (
                        <div key={previewUrl} className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm bg-slate-100">
                          <Image src={previewUrl} alt={`Previsualización ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="propiedad interior"/>
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md" onClick={() => removeImage(index)} disabled={isUploading} aria-label="Eliminar imagen" > <Trash2 className="h-4 w-4" /> </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isUploading && ( <div className="flex items-center mt-3 text-sm text-primary"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo imágenes... </div> )}
                  <FormMessage id={formMessageId} />
                </FormItem>
              );
            }}
          />

          <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <FormControl><Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /></FormControl> <FormDescription>Lista características importantes de tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>

          <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || isCheckingAuth || !loggedInUser || isUploading}>
            {(form.formState.isSubmitting || isCheckingAuth || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Subiendo imágenes...' : 'Publicar Propiedad'}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
                <UserCircle className="h-6 w-6 mr-2 text-primary" />
                Acción Requerida
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para publicar una propiedad, primero debes iniciar sesión o crear una cuenta en PropSpot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Entendido</AlertDialogCancel>
            <Button asChild className="w-full sm:w-auto" onClick={() => setShowAuthAlert(false)}>
              <Link href="/auth/signup" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" /> Registrarse
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={() => setShowAuthAlert(false)}>
              <Link href="/auth/signin" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
              </Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
