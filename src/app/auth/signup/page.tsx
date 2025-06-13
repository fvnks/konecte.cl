
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signUpAction, type SignUpFormValues } from "@/actions/authActions";
import { signUpSchema } from '@/lib/types';
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      rut: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    const result = await signUpAction(values);
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

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-5xl lg:grid lg:grid-cols-2 rounded-xl shadow-2xl overflow-hidden bg-card">
        <div className="hidden lg:flex items-center justify-center bg-primary/10 p-8">
          <Image
            src="https://bukmy.cl/img/register.png"
            alt="Ilustración de registro"
            width={500}
            height={500}
            className="object-contain"
            data-ai-hint="registro usuarios"
          />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardHeader className="text-center px-0">
              <CardTitle className="text-2xl sm:text-3xl font-headline">Crear una Cuenta</CardTitle>
              <CardDescription className="text-sm sm:text-base">Únete a PropSpot para listar, encontrar y discutir propiedades.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 px-0">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUT (Empresa o Persona)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Ej: 12.345.678-9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono de Contacto</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Ej: +56 9 1234 5678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-secondary/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="acceptTerms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label
                            htmlFor="acceptTerms"
                            className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Declaro conocer y aceptar los{" "}
                            <Link href="/legal/terms" className="text-primary hover:underline">
                              Términos y Condiciones
                            </Link>{" "}
                            y la{" "}
                            <Link href="/legal/privacy" className="text-primary hover:underline">
                              Política de Privacidad
                            </Link>
                            . *
                          </label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full flex items-center gap-2" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="h-4 w-4" />
                    )}
                    Registrarse
                  </Button>
                </CardContent>
              </form>
            </Form>
            <CardFooter className="flex flex-col gap-3 text-center pt-4 px-0">
              <p className="mt-2 text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
