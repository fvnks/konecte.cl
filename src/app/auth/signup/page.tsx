
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signUpAction, type SignUpFormValues } from "@/actions/authActions";
import { signUpSchema } from '@/lib/types';
import { getEditableTextsByGroupAction } from '@/actions/editableTextActions';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

const defaultTexts = {
  auth_signup_page_title: "Crear una Cuenta en konecte",
  auth_signup_page_description: "Únete para listar, encontrar y discutir propiedades.",
  auth_signup_name_label: "Nombre Completo *",
  auth_signup_email_label: "Correo Electrónico *",
  auth_signup_rut_label: "RUT (Empresa o Persona)",
  auth_signup_phone_label: "Teléfono de Contacto",
  auth_signup_password_label: "Contraseña *",
  auth_signup_confirm_password_label: "Confirmar Contraseña *",
  auth_signup_terms_label_part1: "Declaro conocer y aceptar los",
  auth_signup_terms_link_terms: "Términos y Condiciones",
  auth_signup_terms_label_part2: "y la",
  auth_signup_terms_link_privacy: "Política de Privacidad",
  auth_signup_terms_label_part3: ". *",
  auth_signup_button_text: "Registrarse",
  auth_signup_signin_prompt: "¿Ya tienes una cuenta?",
  auth_signup_signin_link_text: "Inicia sesión",
};


export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [texts, setTexts] = useState(defaultTexts);
  const [isLoadingTexts, setIsLoadingTexts] = useState(true);
  const [accountType, setAccountType] = useState<'natural' | 'broker'>('natural');

  useEffect(() => {
    async function fetchTexts() {
      try {
        const fetchedTexts = await getEditableTextsByGroupAction('auth_signup');
        setTexts(prev => ({ ...prev, ...fetchedTexts }));
      } catch (error) {
        console.error("Error fetching editable texts for signup page:", error);
      } finally {
        setIsLoadingTexts(false);
      }
    }
    fetchTexts();
  }, []);


  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: 'natural',
      name: "",
      email: "",
      phone_number: "",
      rut_tin: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      // Persona natural specific
      experience_selling_properties: undefined,
      // Broker/Inmobiliaria specific
      company_name: "",
      main_operating_region: "",
      main_operating_commune: "",
      properties_in_portfolio_count: undefined,
      website_social_media_link: "",
    },
  });
  
  // Watch accountType to update the form's hidden field
  const watchedAccountType = form.watch('accountType');
  useEffect(() => {
      if (watchedAccountType !== accountType) {
          setAccountType(watchedAccountType);
      }
  }, [watchedAccountType, accountType]);

  async function onSubmit(values: SignUpFormValues) {
    const result = await signUpAction(values); // signUpAction will handle conditional logic
    if (result.success && result.user) {
      toast({
        title: "Registro Exitoso",
        description: "¡Tu cuenta ha sido creada! Ahora puedes iniciar sesión.",
      });
      router.push('/auth/signin');
    } else {
      toast({
        title: "Error de Registro",
        description: result.message || "No se pudo crear tu cuenta. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  if (isLoadingTexts) {
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] w-full lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex relative h-full bg-primary/10">
        <Image
          src="https://bukmy.cl/img/register.png"
          alt="Ilustración de registro"
          fill
          style={{objectFit: "cover", objectPosition: "top"}}
          sizes="50vw"
          priority
          data-ai-hint="registro usuarios"
        />
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
        <Card className="w-full max-w-lg lg:shadow-xl lg:border lg:rounded-xl lg:p-4 shadow-none border-0"> {/* max-w-lg for wider form */}
          <CardHeader className="text-center px-0 sm:px-2">
            <CardTitle className="text-2xl sm:text-3xl font-headline">{texts.auth_signup_page_title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{texts.auth_signup_page_description}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-5 px-0 sm:px-2"> {/* Increased space-y */}
                
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">Paso 1: ¿Quién eres?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setAccountType(value as 'natural' | 'broker');
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="natural" id="r_natural" /></FormControl>
                            <FormLabel htmlFor="r_natural" className="font-normal cursor-pointer">Persona natural</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="broker" id="r_broker" /></FormControl>
                            <FormLabel htmlFor="r_broker" className="font-normal cursor-pointer">Corredor / Inmobiliaria</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <FormLabel className="text-base font-semibold block pt-2">Paso 2: Completa tus datos</FormLabel>

                {/* Common Fields */}
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem> <FormLabel>{accountType === 'broker' ? 'Nombre del Representante *' : texts.auth_signup_name_label}</FormLabel> <FormControl><Input type="text" placeholder={accountType === 'broker' ? 'Ej: Ana Corredora' : 'Ej: Juan Pérez'} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_email_label}</FormLabel> <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_phone_label}</FormLabel> <FormControl><Input type="tel" placeholder="Ej: +56 9 1234 5678" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                
                {/* RUT - Conditionally required for Broker in backend */}
                <FormField control={form.control} name="rut_tin" render={({ field }) => (<FormItem> <FormLabel>{accountType === 'broker' ? 'RUT (Empresa o Personal del Corredor) *' : 'RUT (Opcional)'}</FormLabel> <FormControl><Input type="text" placeholder="Ej: 76.123.456-K o 12.345.678-9" {...field} /></FormControl> {accountType === 'broker' && <ShadFormDescription className="text-xs">El RUT es necesario para corredores e inmobiliarias.</ShadFormDescription>} <FormMessage /> </FormItem> )}/>

                {/* Persona Natural Specific */}
                {accountType === 'natural' && (
                  <FormField
                    control={form.control}
                    name="experience_selling_properties"
                    render={({ field }) => (
                      <FormItem className="space-y-2 rounded-md border p-3 shadow-sm bg-secondary/30">
                        <FormLabel className="text-sm">¿Tienes experiencia vendiendo propiedades? (Opcional)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="yes" id="exp_yes" /></FormControl>
                              <FormLabel htmlFor="exp_yes" className="font-normal cursor-pointer text-sm">Sí</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="no" id="exp_no" /></FormControl>
                              <FormLabel htmlFor="exp_no" className="font-normal cursor-pointer text-sm">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Broker/Inmobiliaria Specific */}
                {accountType === 'broker' && (
                  <div className="space-y-5 pt-3 border-t border-dashed">
                    <FormField control={form.control} name="company_name" render={({ field }) => (<FormItem> <FormLabel>Nombre de la Empresa (Opcional si eres independiente)</FormLabel> <FormControl><Input type="text" placeholder="Ej: Inmobiliaria PropSpot" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="main_operating_region" render={({ field }) => (<FormItem> <FormLabel>Región Principal donde Opera</FormLabel> <FormControl><Input type="text" placeholder="Ej: Valparaíso" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={form.control} name="main_operating_commune" render={({ field }) => (<FormItem> <FormLabel>Comuna Principal donde Opera</FormLabel> <FormControl><Input type="text" placeholder="Ej: Viña del Mar" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                    <FormField control={form.control} name="properties_in_portfolio_count" render={({ field }) => (<FormItem> <FormLabel>Cantidad de Propiedades en Cartera (Aprox., Opcional)</FormLabel> <FormControl><Input type="number" min="0" placeholder="Ej: 25" {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="website_social_media_link" render={({ field }) => (<FormItem> <FormLabel>Sitio Web o Red Social Principal (Opcional)</FormLabel> <FormControl><Input type="url" placeholder="https://tuinmobiliaria.cl" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  </div>
                )}

                {/* Password Fields */}
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_password_label}</FormLabel> <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_confirm_password_label}</FormLabel> <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-secondary/30">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="acceptTerms"/></FormControl>
                      <div className="space-y-1 leading-none">
                        <label htmlFor="acceptTerms" className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {texts.auth_signup_terms_label_part1}{" "}
                          <Link href="/legal/terms" className="text-primary hover:underline">{texts.auth_signup_terms_link_terms}</Link>{" "}
                          {texts.auth_signup_terms_label_part2}{" "}
                          <Link href="/legal/privacy" className="text-primary hover:underline">{texts.auth_signup_terms_link_privacy}</Link>
                          {texts.auth_signup_terms_label_part3}
                        </label>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full flex items-center gap-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<UserPlus className="h-4 w-4" />)}
                  {texts.auth_signup_button_text}
                </Button>
              </CardContent>
            </form>
          </Form>
          <CardFooter className="flex flex-col gap-3 text-center pt-4 px-0 sm:px-2">
            <p className="mt-2 text-sm text-muted-foreground">
              {texts.auth_signup_signin_prompt}{" "}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">{texts.auth_signup_signin_link_text}</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
