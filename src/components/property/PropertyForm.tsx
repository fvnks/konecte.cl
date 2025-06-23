// src/components/property/PropertyForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormField as useFormFieldShadcn } from "react-hook-form"; // Renamed to avoid conflict
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
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { submitPropertyAction } from "@/actions/propertyActions";
import type { PropertyType, ListingCategory, User as StoredUser, PropertyFormValues, OrientationType } from "@/lib/types";
import { propertyFormSchema, orientationValues } from '@/lib/types';
import { Loader2, Home, Bath, Car, Dog, Sofa, Building, Warehouse, Compass, BedDouble } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import dynamic from 'next/dynamic';
// Import the new DND component and its types
import type { SortableImageItem } from './ImageDropzoneSortableCreate'; 
import { chileanRegions } from "@/lib/data";

const ImageDropzoneSortableCreateWithNoSSR = dynamic(
  () => import('./ImageDropzoneSortableCreate'),
  { 
    ssr: false,
    loading: () => <div className="min-h-[10rem] w-full rounded-lg bg-muted/20 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/><span className="ml-2 text-muted-foreground">Cargando cargador...</span></div>
  }
);


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


export default function PropertyForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orderedImageFiles, setOrderedImageFiles] = useState<File[]>([]); // State to hold files from DND component
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: undefined,
      currency: "CLP",
      address: "",
      city: "",
      region: undefined,
      hideExactAddress: false, // New field
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
      images: [], // This will be populated with URLs before submit, not Files
      features: "",
      propertyType: undefined,
      category: undefined,
    },
  });

  const watchedPropertyType = form.watch("propertyType");
  const watchedCategory = form.watch("category");

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser = JSON.parse(userJson);
        setLoggedInUser(parsedUser);
      } catch (error) {
        console.error("[PropertyForm] Auth Check Effect: Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);
      }
    } else {
      setLoggedInUser(null);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleOrderedImagesChange = useCallback((filesInOrder: File[]) => {
    setOrderedImageFiles(filesInOrder);
  }, []);


  async function onSubmit(values: PropertyFormValues) {
    if (isCheckingAuth) {
      toast({ title: "Verificando sesión...", description: "Por favor espera un momento." });
      return;
    }
    if (!loggedInUser || !loggedInUser.id) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para publicar.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const finalImageUrlsForServer: string[] = [];

    for (const file of orderedImageFiles) {
      const formData = new FormData();
      formData.append("imageFile", file);
      try {
        const response = await fetch('/api/upload-image-to-cpanel', { method: 'POST', body: formData });
        const result = await response.json();
        if (response.ok && result.success && result.url) {
          finalImageUrlsForServer.push(result.url);
        } else {
          toast({ title: "Error de Subida Parcial", description: `No se pudo subir ${file.name}: ${result.message || 'Error desconocido'}`, variant: "warning" });
        }
      } catch (error: any) {
        toast({ title: "Error de Subida", description: `No se pudo subir ${file.name}. Error: ${error.message}`, variant: "destructive" });
      }
    }
    setIsUploading(false);

    if (orderedImageFiles.length > 0 && finalImageUrlsForServer.length === 0 && orderedImageFiles.some(file => file.size > 0)) { // Check if there were actual files to upload
        toast({ title: "Error de Imágenes", description: "No se pudieron subir las imágenes. Intenta de nuevo.", variant: "destructive"});
        return;
    }
    
    const dataToSubmit = {
      ...values,
      images: finalImageUrlsForServer, // Use the uploaded URLs
      bedrooms: values.bedrooms === '' ? 0 : Number(values.bedrooms),
      bathrooms: values.bathrooms === '' ? 0 : Number(values.bathrooms),
      parkingSpaces: values.parkingSpaces === '' ? 0 : Number(values.parkingSpaces),
      usefulAreaSqMeters: values.usefulAreaSqMeters === '' || values.usefulAreaSqMeters === undefined || values.usefulAreaSqMeters === null
                            ? undefined

                            : Number(values.usefulAreaSqMeters),
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
      setOrderedImageFiles([]); // Reset ordered files state
      if (result.propertySlug) {
        router.push(`/properties/${result.propertySlug}`);
      } else {
        router.push('/properties');
      }
    } else {
      toast({ title: "Error al Publicar", description: result.message || "No se pudo enviar tu propiedad.", variant: "destructive" });
    }
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
            <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Precio</FormLabel> <FormControl><Input type="number" placeholder="Ej: 85000000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dirección Completa</FormLabel>
                <FormControl>
                    <AddressAutocompleteInput
                    value={field.value}
                    onChange={(address, details) => {
                        field.onChange(address);
                        if (details?.city) form.setValue('city', details.city, { shouldValidate: true });
                        if (details?.region) form.setValue('region', details.region as any, { shouldValidate: true });
                        if (details?.country) form.setValue('country', details.country, { shouldValidate: true });
                    }}
                    placeholder="Comienza a escribir la dirección..."
                    disabled={form.formState.isSubmitting || isCheckingAuth}
                    />
                </FormControl>
                <FormDescription>Ingresa la dirección. Las sugerencias aparecerán mientras escribes.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
          <FormField
            control={form.control}
            name="hideExactAddress"
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
                <div className="space-y-1 leading-none">
                    <FormLabel>
                    Ocultar dirección exacta
                    </FormLabel>
                    <FormDescription>
                    Si marcas esto, solo se mostrará la ciudad y la región en el mapa público.
                    </FormDescription>
                </div>
                </FormItem>
            )}
            />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad/Comuna</FormLabel> <FormControl><Input placeholder="Ej: Valparaíso" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Región</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una región" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chileanRegions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input placeholder="Ej: Chile" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="totalAreaSqMeters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Home className="mr-2 h-4 w-4 text-primary"/>Superficie Total (m²)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 120" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usefulAreaSqMeters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><span><Home className="mr-2 h-4 w-4 text-primary"/>Superficie Útil (m²) (Opcional)</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 100" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
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
                  <FormLabel className="flex items-center"><BedDouble className="mr-2 h-4 w-4 text-primary"/>N° de Dormitorios</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} />
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
                  <FormLabel className="flex items-center"><Bath className="mr-2 h-4 w-4 text-primary"/>N° de Baños</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parkingSpaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Car className="mr-2 h-4 w-4 text-primary"/>N° Estacionamientos</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="orientation"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Compass className="mr-2 h-5 w-5 text-primary"/>Orientación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona orientación" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {orientationOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
          />
          <div className="space-y-4 pt-2">
              <FormLabel className="text-base font-medium">Otras Características</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {showPetsAllowed && <FormField control={form.control} name="petsAllowed" render={({ field }) => (<FormItem className="flex items-center space-x-2 p-3 rounded-lg border bg-card/30 hover:bg-accent/50 transition-colors"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="petsAllowed"/> <FormLabel htmlFor="petsAllowed" className="font-normal flex items-center"><Dog className="mr-2 h-5 w-5 text-primary"/>Se Aceptan Mascotas</FormLabel> </FormItem>)}/>}
                {showFurnished && <FormField control={form.control} name="furnished" render={({ field }) => (<FormItem className="flex items-center space-x-2 p-3 rounded-lg border bg-card/30 hover:bg-accent/50 transition-colors"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="furnished"/> <FormLabel htmlFor="furnished" className="font-normal flex items-center"><Sofa className="mr-2 h-5 w-5 text-primary"/>Amoblado</FormLabel> </FormItem>)}/>}
                {showCommercialUse && <FormField control={form.control} name="commercialUseAllowed" render={({ field }) => (<FormItem className="flex items-center space-x-2 p-3 rounded-lg border bg-card/30 hover:bg-accent/50 transition-colors"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="commercialUse"/> <FormLabel htmlFor="commercialUse" className="font-normal flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/>Permite Uso Comercial</FormLabel> </FormItem>)}/>}
                {showStorage && <FormField control={form.control} name="hasStorage" render={({ field }) => (<FormItem className="flex items-center space-x-2 p-3 rounded-lg border bg-card/30 hover:bg-accent/50 transition-colors"> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="hasStorage"/> <FormLabel htmlFor="hasStorage" className="font-normal flex items-center"><Warehouse className="mr-2 h-5 w-5 text-primary"/>Tiene Bodega</FormLabel> </FormItem>)}/>}
              </div>
               { !showPetsAllowed && !showFurnished && !showCommercialUse && !showStorage && watchedPropertyType && watchedCategory &&
                  <p className="text-sm text-muted-foreground italic">No hay características adicionales aplicables para el tipo y categoría de propiedad seleccionada.</p>
              }
          </div>
          
          <FormItem>
            <FormLabel>Imágenes de la Propiedad</FormLabel>
            <ImageDropzoneSortableCreateWithNoSSR 
              onImagesChange={handleOrderedImagesChange}
              initialImages={orderedImageFiles}
              isSubmittingForm={form.formState.isSubmitting || isUploading}
            />
            <FormDescription>Sube imágenes claras y de buena calidad. Puedes arrastrarlas para cambiar el orden (la primera será la principal).</FormDescription>
            <FormMessage>{form.formState.errors.images?.message}</FormMessage>
          </FormItem>

          <FormField control={form.control} name="features" render={({ field }) => ( <FormItem> <FormLabel>Características Adicionales (separadas por comas)</FormLabel> <FormControl><Input placeholder="Ej: Piscina, Quincho, Estacionamiento" {...field} /></FormControl> <FormDescription>Lista características importantes de tu propiedad.</FormDescription> <FormMessage /> </FormItem> )}/>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isCheckingAuth || !loggedInUser || form.formState.isSubmitting || isUploading}
          >
            {(form.formState.isSubmitting || isUploading || isCheckingAuth) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCheckingAuth ? 'Verificando...' : (isUploading ? 'Subiendo imágenes...' : 'Publicar Propiedad')}
          </Button>
        </form>
      </Form>
    </>
  );
}
