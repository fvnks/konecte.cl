// src/components/profile/EditProfileForm.tsx
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
import { useToast } from "@/hooks/use-toast";
import { userProfileFormSchema, type UserProfileFormValues, type User as StoredUser } from "@/lib/types";
import { updateUserProfileAction } from "@/actions/userActions";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

interface EditProfileFormProps {
  user: StoredUser;
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      name: user.name || "",
      phone_number: user.phone_number || "",
      avatarUrl: user.avatarUrl || "",
      company_name: user.company_name || "",
      main_operating_region: user.main_operating_region || "",
      main_operating_commune: user.main_operating_commune || "",
      properties_in_portfolio_count: user.properties_in_portfolio_count ?? undefined,
      website_social_media_link: user.website_social_media_link || "",
    },
  });

  async function onSubmit(values: UserProfileFormValues) {
    const result = await updateUserProfileAction(user.id, values);

    if (result.success && result.updatedUser) {
      toast({
        title: "Perfil Actualizado",
        description: "Tu información ha sido guardada exitosamente.",
      });
      // Update localStorage with the new user info
      localStorage.setItem('loggedInUser', JSON.stringify(result.updatedUser));
      window.dispatchEvent(new CustomEvent('userSessionChanged')); // Notify layout components
      router.push('/profile');
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo guardar tu perfil.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="phone_number" render={({ field }) => ( <FormItem> <FormLabel>Número de Teléfono</FormLabel> <FormControl><Input placeholder="+56 9 1234 5678" {...field} /></FormControl> <FormDescription>Este número será visible para otros según las reglas de la plataforma.</FormDescription> <FormMessage /> </FormItem> )}/>
        
        <FormField control={form.control} name="avatarUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>URL de la Foto de Perfil (Avatar)</FormLabel>
            <FormControl><Input placeholder="https://ejemplo.com/avatar.png" {...field} value={field.value || ''}/></FormControl>
            <FormMessage />
            {form.watch("avatarUrl") && (
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Vista Previa:</span>
                <Image src={form.watch("avatarUrl")!} alt="Vista previa del avatar" width={40} height={40} className="rounded-full" data-ai-hint="persona avatar" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </FormItem>
        )}/>

        {user.role_id === 'broker' && (
          <>
            <Separator />
            <h3 className="text-lg font-medium text-primary">Información de Corredor</h3>
            <FormField control={form.control} name="company_name" render={({ field }) => ( <FormItem> <FormLabel>Nombre de la Empresa</FormLabel> <FormControl><Input placeholder="Inmobiliaria Konecte" {...field} value={field.value || ''}/></FormControl> <FormMessage /> </FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="main_operating_region" render={({ field }) => ( <FormItem> <FormLabel>Región Principal</FormLabel> <FormControl><Input placeholder="Valparaíso" {...field} value={field.value || ''}/></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="main_operating_commune" render={({ field }) => ( <FormItem> <FormLabel>Comuna Principal</FormLabel> <FormControl><Input placeholder="Viña del Mar" {...field} value={field.value || ''}/></FormControl> <FormMessage /> </FormItem> )}/>
            </div>
            <FormField control={form.control} name="properties_in_portfolio_count" render={({ field }) => ( <FormItem> <FormLabel>Propiedades en Cartera (Aprox.)</FormLabel> <FormControl><Input type="number" min="0" placeholder="25" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="website_social_media_link" render={({ field }) => ( <FormItem> <FormLabel>Sitio Web o Red Social</FormLabel> <FormControl><Input type="url" placeholder="https://tuweb.cl" {...field} value={field.value || ''}/></FormControl> <FormMessage /> </FormItem> )}/>
          </>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}
