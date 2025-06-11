'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signUpAction, type SignUpFormValues } from "@/actions/authActions";
import { useRouter } from "next/navigation";

const signUpSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255),
  email: z.string().email("Correo electrónico inválido.").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres.")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Path of error
});


export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    const result = await signUpAction(values);
    if (result.success && result.user) {
      toast({
        title: "Registro Exitoso",
        description: "¡Tu cuenta ha sido creada! Ahora puedes iniciar sesión.",
      });
      // Opcional: Iniciar sesión automáticamente y redirigir
      // Para ello, necesitaríamos una acción similar a signInAction o que signUpAction devuelva un token/sesión
      // Por ahora, solo redirigimos a la página de inicio de sesión
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
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Crear una Cuenta</CardTitle>
          <CardDescription>Únete a PropSpot para listar, encontrar y discutir propiedades.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
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
                    <FormLabel>Contraseña</FormLabel>
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
                    <FormLabel>Confirmar Contraseña</FormLabel>
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
                    <UserPlus className="h-4 w-4" />
                )}
                Registrarse
              </Button>
            </CardContent>
          </form>
        </Form>
         <CardFooter className="flex flex-col gap-3 text-center">
           {/* <p className="text-xs text-muted-foreground">
            O regístrate con
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="w-full">Google</Button>
            <Button variant="outline" className="w-full">Facebook</Button>
          </div> */}
          <p className="mt-4 text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
