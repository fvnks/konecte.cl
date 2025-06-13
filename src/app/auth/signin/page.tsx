
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signInAction, type SignInFormValues } from "@/actions/authActions";
import { useRouter } from "next/navigation";
import Image from "next/image";

const signInSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormValues) {
    const result = await signInAction(values);
    if (result.success && result.user) {
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `¡Bienvenido de nuevo, ${result.user.name}!`,
      });
      localStorage.setItem('loggedInUser', JSON.stringify({ 
        id: result.user.id, 
        name: result.user.name, 
        email: result.user.email,
        role_id: result.user.role_id,
        roleName: result.user.role_name,
        planId: result.user.plan_id,
        planName: result.user.plan_name,
        avatarUrl: result.user.avatarUrl
      }));
      window.dispatchEvent(new Event('storage')); 
      
      if (result.user.role_id === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      toast({
        title: "Error de Inicio de Sesión",
        description: result.message || "No se pudo iniciar sesión. Verifica tus credenciales.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] w-full lg:grid lg:grid-cols-2">
      {/* Columna Izquierda: Imagen */}
      <div className="hidden lg:flex relative h-full bg-primary/10">
        <Image
          src="https://bukmy.cl/img/login.jpg"
          alt="Ilustración de inicio de sesión"
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="acceso seguridad login"
        />
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
        <Card className="w-full max-w-md lg:shadow-xl lg:border lg:rounded-xl lg:p-4 shadow-none border-0 lg:bg-card">
          <CardHeader className="text-center px-0 sm:px-2">
            <CardTitle className="text-2xl sm:text-3xl font-headline">¡Bienvenido de Nuevo!</CardTitle>
            <CardDescription className="text-sm sm:text-base">Inicia sesión para acceder a tu cuenta de PropSpot.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 px-0 sm:px-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                          <FormLabel>Contraseña</FormLabel>
                          <Link href="#" className="text-xs text-primary hover:underline">
                              ¿Olvidaste tu contraseña?
                          </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full flex items-center gap-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Iniciar Sesión
                </Button>
              </CardContent>
            </form>
          </Form>
          <CardFooter className="flex flex-col gap-3 text-center pt-4 px-0 sm:px-2">
            <p className="mt-4 text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
