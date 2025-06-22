// src/components/request/RequestForm.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { submitRequestAction } from "@/actions/requestActions";
import type { PropertyType, ListingCategory, User as StoredUser, RequestFormValues } from "@/lib/types";
import { requestFormSchema } from "@/lib/types";
import { Loader2, UserCircle, Handshake } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chileanRegions } from "@/lib/data";
// AuthRequiredDialog removed

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

export default function RequestForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isBroker, setIsBroker] = useState(false);
  // showAuthAlert state removed

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: StoredUser = JSON.parse(userJson);
        setLoggedInUser(user);
        setIsBroker(user.role_id === 'broker');
      } catch (error) {
        console.error("[RequestForm] Auth Check Effect: Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        setLoggedInUser(null);
      }
    } else {
      setLoggedInUser(null);
    }
    setIsCheckingAuth(false);
  }, []);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      desiredPropertyType: [],
      desiredCategories: [],
      desiredLocationCity: "",
      desiredLocationRegion: undefined,
      desiredLocationNeighborhood: "",
      minBedrooms: undefined,
      minBathrooms: undefined,
      budgetMax: undefined,
      open_for_broker_collaboration: false,
    },
  });

  async function onSubmit(values: RequestFormValues) {
    // This function is now only called if the user is logged in and form is valid
    if (!loggedInUser || !loggedInUser.id) {
      // This check is mostly a safeguard, button should be disabled if not logged in
      toast({ title: "Error", description: "Debes iniciar sesión para publicar una solicitud.", variant: "destructive" });
      return;
    }

    const dataToSubmit = {
        ...values,
        minBedrooms: values.minBedrooms === '' ? undefined : values.minBedrooms,
        minBathrooms: values.minBathrooms === '' ? undefined : values.minBathrooms,
        budgetMax: values.budgetMax === '' ? undefined : values.budgetMax,
        open_for_broker_collaboration: isBroker ? values.open_for_broker_collaboration : false,
    };

    const result = await submitRequestAction(dataToSubmit, loggedInUser.id);
    if (result.success) {
      toast({
        title: result.autoMatchesCount && result.autoMatchesCount > 0 ? "¡Solicitud Publicada y Matches Encontrados!" : "Solicitud Publicada",
        description: result.message || "Tu solicitud ha sido enviada exitosamente.",
        duration: result.autoMatchesCount && result.autoMatchesCount > 0 ? 7000 : 5000,
      });
      form.reset();
      if (result.requestSlug) {
        router.push(`/requests/${result.requestSlug}`);
      } else {
        router.push('/requests');
      }
    } else {
      toast({
        title: "Error al Publicar Solicitud",
        description: result.message || "No se pudo enviar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... (todos los FormField como estaban) ... */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título de la Solicitud</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Busco departamento de 2 dormitorios en Providencia" {...field} />
                </FormControl>
                <FormDescription>Un título claro sobre lo que estás buscando.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción Detallada de tu Búsqueda</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe con detalle qué tipo de propiedad buscas, características importantes, etc." className="min-h-[120px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desiredPropertyType"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Tipo de Transacción Buscada</FormLabel>
                  <FormDescription>
                    Selecciona si buscas arrendar, comprar, o ambos.
                  </FormDescription>
                </div>
                {propertyTypeOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="desiredPropertyType"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.value])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== item.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desiredCategories"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Categorías de Propiedad Deseadas</FormLabel>
                  <FormDescription>
                    Selecciona los tipos de propiedad que te interesan.
                  </FormDescription>
                </div>
                {categoryOptions.map((item) => (
                  <FormField
                    key={item.value}
                    control={form.control}
                    name="desiredCategories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.value}
                          className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.value])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== item.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="desiredLocationRegion"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Región Deseada *</FormLabel>
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
            <FormField
            control={form.control}
            name="desiredLocationCity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ciudad/Comuna Deseada *</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Santiago" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="desiredLocationNeighborhood"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Barrio/Sector Preferido (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Las Condes, Ñuñoa, Reñaca" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="minBedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mínimo de Dormitorios (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 2" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minBathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mínimo de Baños (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budgetMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto Máximo (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 600000 (en CLP)" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                  </FormControl>
                  <FormDescription>Indica tu presupuesto máximo en CLP o UF.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isBroker && (
            <FormField
              control={form.control}
              name="open_for_broker_collaboration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium flex items-center">
                      <Handshake className="h-5 w-5 mr-2 text-primary"/>
                      Abrir a Colaboración de Corredores
                    </FormLabel>
                    <FormDescription>
                      Permite que otros corredores vean esta solicitud y te propongan propiedades de su cartera.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
          
          <Button 
            type="submit"
            className="w-full md:w-auto" 
            disabled={isCheckingAuth || !loggedInUser || form.formState.isSubmitting}
          >
            {(form.formState.isSubmitting || isCheckingAuth) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCheckingAuth ? 'Verificando...' : 'Publicar Solicitud'}
          </Button>
        </form>
      </Form>
    </>
  );
}
