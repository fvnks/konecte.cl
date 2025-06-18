// src/app/auth/signup/page.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button"; // Original button replaced
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Briefcase } from "lucide-react"; // Removed ArrowRight
import Link from "next/link";
import Image from "next/image";
import AnimatedContinueButton from "@/components/ui/AnimatedContinueButton"; // Import the new button

export default function SignUpStep1Page() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'natural' | 'broker' | ''>('');

  const handleContinue = () => {
    if (accountType) {
      router.push(`/auth/signup/${accountType}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] w-full lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex relative h-full bg-primary/10">
        <Image
          src="https://bukmy.cl/img/register_step1.jpg"
          alt="Ilustración de selección de tipo de cuenta"
          fill
          style={{objectFit: "cover", objectPosition: "center"}}
          sizes="50vw"
          priority
          data-ai-hint="opciones seleccion"
        />
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 h-full bg-card lg:bg-background">
        <Card className="w-full max-w-md lg:shadow-xl lg:border lg:rounded-xl lg:p-4 shadow-none border-0">
          <CardHeader className="text-center px-0 sm:px-2">
            <CardTitle className="text-2xl sm:text-3xl font-headline">Crear Cuenta: Paso 1 de 2</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Para comenzar, dinos qué tipo de cuenta necesitas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0 sm:px-2">
            <RadioGroup
              value={accountType}
              onValueChange={(value: 'natural' | 'broker') => setAccountType(value)}
              className="space-y-3"
            >
              <Label
                htmlFor="type-natural"
                className={`flex flex-col items-start space-y-1 rounded-md border p-4 transition-all hover:bg-accent/50 ${accountType === 'natural' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center w-full">
                    <RadioGroupItem value="natural" id="type-natural" className="mr-3 flex-shrink-0" />
                    <div className="flex-grow">
                        <span className="font-semibold text-base block">Persona Natural</span>
                        <span className="text-xs text-muted-foreground">Quiero publicar mi propiedad o buscar una para mí.</span>
                    </div>
                    <User className={`ml-3 h-7 w-7 ${accountType === 'natural' ? 'text-primary' : 'text-muted-foreground/70'}`} />
                </div>
              </Label>
              <Label
                htmlFor="type-broker"
                className={`flex flex-col items-start space-y-1 rounded-md border p-4 transition-all hover:bg-accent/50 ${accountType === 'broker' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border'}`}
              >
                 <div className="flex items-center w-full">
                    <RadioGroupItem value="broker" id="type-broker" className="mr-3 flex-shrink-0" />
                    <div className="flex-grow">
                        <span className="font-semibold text-base block">Corredor / Inmobiliaria</span>
                        <span className="text-xs text-muted-foreground">Gestiono propiedades profesionalmente.</span>
                    </div>
                    <Briefcase className={`ml-3 h-7 w-7 ${accountType === 'broker' ? 'text-primary' : 'text-muted-foreground/70'}`} />
                </div>
              </Label>
            </RadioGroup>
            <AnimatedContinueButton
              type="button"
              className="w-full mt-4" // Ensure full width for the wrapper
              onClick={handleContinue}
              disabled={!accountType}
            >
              Continuar al Paso 2
            </AnimatedContinueButton>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-center pt-4 px-0 sm:px-2">
            <p className="mt-4 text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
