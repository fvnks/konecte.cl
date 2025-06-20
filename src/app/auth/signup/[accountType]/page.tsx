
// src/app/auth/signup/[accountType]/page.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2, ArrowLeft, User, Briefcase } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signUpAction, type SignUpFormValues } from "@/actions/authActions";
import { signUpSchema } from '@/lib/types';
import { getEditableTextsByGroupAction } from '@/actions/editableTextActions';
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
// RadioGroup imports removed as it's no longer used for experience_selling_properties
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const defaultTexts = {
  auth_signup_page_title: "Completa tu Registro",
  auth_signup_page_description: "Únete para listar, encontrar y discutir propiedades.",
  auth_signup_name_label: "Nombre Completo *",
  auth_signup_email_label: "Correo Electrónico *",
  auth_signup_rut_label: "RUT (Empresa o Persona) *",
  auth_signup_phone_label: "Teléfono de Contacto o WhatsApp *",
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

export default function SignUpStep2Page() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const accountTypeParam = params.accountType as 'natural' | 'broker';

  const [texts, setTexts] = useState(defaultTexts);
  const [isLoadingTexts, setIsLoadingTexts] = useState(true);

  useEffect(() => {
    if (accountTypeParam !== 'natural' && accountTypeParam !== 'broker') {
      toast({ title: "Tipo de cuenta inválido", description: "Por favor, selecciona un tipo de cuenta válido para continuar.", variant: "destructive" });
      router.push('/auth/signup');
    }
  }, [accountTypeParam, router, toast]);

  useEffect(() => {
    async function fetchTexts() {
      try {
        const fetchedTexts = await getEditableTextsByGroupAction('auth_signup');
        const combinedTexts = { ...defaultTexts, ...fetchedTexts };
        if (combinedTexts.auth_signup_rut_label && !combinedTexts.auth_signup_rut_label.endsWith('*')) {
            combinedTexts.auth_signup_rut_label = combinedTexts.auth_signup_rut_label.trim() + ' *';
        }
        if (combinedTexts.auth_signup_phone_label && !combinedTexts.auth_signup_phone_label.endsWith('*')) {
            combinedTexts.auth_signup_phone_label = combinedTexts.auth_signup_phone_label.trim() + ' *';
        }
        setTexts(combinedTexts);
      } catch (error) {
        console.error("Error fetching editable texts for signup page:", error);
        setTexts(defaultTexts);
      } finally {
        setIsLoadingTexts(false);
      }
    }
    fetchTexts();
  }, []);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: accountTypeParam,
      name: "",
      email: "",
      phone_number: "",
      rut_tin: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      company_name: "",
      main_operating_region: "",
      main_operating_commune: "",
      properties_in_portfolio_count: undefined,
      website_social_media_link: "",
    },
  });

  useEffect(() => {
    if (accountTypeParam && form.getValues('accountType') !== accountTypeParam) {
      form.setValue('accountType', accountTypeParam);
    }
  }, [accountTypeParam, form]);


  async function onSubmit(values: SignUpFormValues) {
    const submissionValues = {
      ...values,
      accountType: accountTypeParam,
    };

    const result = await signUpAction(submissionValues);
    if (result.success && result.user) {
      toast({
        title: "Registro Exitoso",
        description: result.message || "¡Tu cuenta ha sido creada! Se ha enviado un código de verificación a tu teléfono.",
      });
      if (result.verificationPending && result.userId) {
        router.push(`/auth/verify-phone?userId=${result.userId}&phoneEnding=${result.phone_number_ending || ''}`);
      } else {
        router.push('/auth/signin'); // Fallback if verification info is missing, though unlikely
      }
    } else {
      toast({
        title: "Error de Registro",
        description: result.message || "No se pudo crear tu cuenta. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  if (isLoadingTexts || (accountTypeParam !== 'natural' && accountTypeParam !== 'broker')) {
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  const pageTitleText = accountTypeParam === 'natural'
    ? "Registro Persona Natural"
    : "Registro Corredor / Inmobiliaria";
  const pageDescriptionText = accountTypeParam === 'natural'
    ? "Completa tus datos para publicar o buscar propiedades."
    : "Completa los datos de tu perfil profesional.";


  return (
    <div className="min-h-[calc(100vh-5rem)] w-full lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex relative h-full bg-primary/10">
        <Image
          src="https://bukmy.cl/img/register.png"
          alt="Ilustración de registro"
          fill
          style={{objectFit: "cover", objectPosition: "center"}}
          sizes="50vw"
          priority
          data-ai-hint="registro personas"
        />
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
        <Card className="w-full max-w-lg lg:shadow-xl lg:border lg:rounded-xl lg:p-4 shadow-none border-0">
        <Button variant="outline" size="sm" onClick={() => router.push('/auth/signup')} className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Paso 1
        </Button>
          <CardHeader className="text-center px-0 sm:px-2 pt-10 lg:pt-6">
            <div className="flex justify-center items-center gap-3 mb-3">
              {accountTypeParam === 'natural' ? <User className="h-10 w-10 text-primary" /> : <Briefcase className="h-10 w-10 text-primary" />}
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-headline">{pageTitleText}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{pageDescriptionText}</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-5 px-0 sm:px-2">
                {/* Common Fields */}
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_name_label}</FormLabel> <FormControl><Input type="text" placeholder={accountTypeParam === 'broker' ? 'Ej: Ana Corredora' : 'Ej: Juan Pérez'} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_email_label}</FormLabel> <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_phone_label}</FormLabel> <FormControl><Input type="tel" placeholder="Ej: +56 9 1234 5678" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="rut_tin" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_rut_label}</FormLabel> <FormControl><Input type="text" placeholder="Ej: 76.123.456-K o 12.345.678-9" {...field} /></FormControl> <ShadFormDescription className="text-xs">Formato: XX.XXX.XXX-X o XXXXXXXX-X</ShadFormDescription> <FormMessage /> </FormItem> )}/>

                {/* Broker/Inmobiliaria Specific */}
                {accountTypeParam === 'broker' && (
                  <div className="space-y-5 pt-3 border-t border-dashed">
                    <FormField control={form.control} name="company_name" render={({ field }) => (<FormItem> <FormLabel>Nombre de la Empresa (Opcional si eres independiente)</FormLabel> <FormControl><Input type="text" placeholder="Ej: Inmobiliaria konecte" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="main_operating_region" render={({ field }) => (<FormItem> <FormLabel>Región Principal donde Opera</FormLabel> <FormControl><Input type="text" placeholder="Ej: Valparaíso" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={form.control} name="main_operating_commune" render={({ field }) => (<FormItem> <FormLabel>Comuna Principal donde Opera</FormLabel> <FormControl><Input type="text" placeholder="Ej: Viña del Mar" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                    <FormField control={form.control} name="properties_in_portfolio_count" render={({ field }) => (<FormItem> <FormLabel>Cantidad de Propiedades en Cartera (Aprox., Opcional)</FormLabel> <FormControl><Input type="number" min="0" placeholder="Ej: 25" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="website_social_media_link" render={({ field }) => (<FormItem> <FormLabel>Sitio Web o Red Social Principal (Opcional)</FormLabel> <FormControl><Input type="url" placeholder="https://tuinmobiliaria.cl" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  </div>
                )}

                {/* Password Fields */}
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem> <FormLabel>{texts.auth_signup_password_label}</FormLabel> <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl> <ShadFormDescription className="text-xs">Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial.</ShadFormDescription> <FormMessage /> </FormItem> )}/>
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
