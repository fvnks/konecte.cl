// src/app/auth/verify-phone/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, SmartphoneNfc } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndSendOtpAction, verifyOtpAction } from '@/actions/otpActions';
import { otpVerificationSchema, type OtpVerificationFormValues } from '@/lib/types';

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumberEnding, setPhoneNumberEnding] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: '',
    },
  });
  
  useEffect(() => {
    const userIdFromQuery = searchParams.get('userId');
    const phoneEndingFromQuery = searchParams.get('phoneEnding');
    
    if (userIdFromQuery) {
      setUserId(userIdFromQuery);
    } else {
      // If no userId, check localStorage for a logged-in user who might be unverified
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.id && !user.phone_verified) {
            setUserId(user.id);
            // If phoneEnding is not in query, attempt to resend OTP to get it
            if (!phoneEndingFromQuery && user.phone_number) {
                handleResendOtp(user.id, true); // silent resend if first load
            }
          } else if (user.id && user.phone_verified) {
            toast({ title: "Teléfono ya verificado", description: "Tu número de teléfono ya ha sido verificado." });
            router.push('/dashboard'); // or profile page
          }
        } catch (e) { console.error("Error parsing user for OTP page", e); }
      }
    }
    if (phoneEndingFromQuery) {
        setPhoneNumberEnding(phoneEndingFromQuery);
    }

  }, [searchParams, router, toast]);


  const handleVerifyOtp = async (values: OtpVerificationFormValues) => {
    if (!userId) {
      toast({ title: 'Error', description: 'No se pudo identificar al usuario.', variant: 'destructive' });
      return;
    }
    setIsVerifying(true);
    const result = await verifyOtpAction(userId, values.otp);
    setIsVerifying(false);

    if (result.success) {
      toast({ title: 'Verificación Exitosa', description: result.message });
      // Update localStorage if needed, or rely on next login to fetch updated user
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
          try {
              const user = JSON.parse(userJson);
              if (user.id === userId) {
                  localStorage.setItem('loggedInUser', JSON.stringify({...user, phone_verified: true }));
                  window.dispatchEvent(new CustomEvent('userSessionChanged'));
              }
          } catch (e) { console.error("Error updating user session after OTP verification", e); }
      }
      router.push('/dashboard'); // Or a more specific "welcome" page
    } else {
      toast({ title: 'Error de Verificación', description: result.message, variant: 'destructive' });
      form.setError("otp", { type: "manual", message: result.message });
    }
  };

  const handleResendOtp = async (currentUserId = userId, silent = false) => {
    if (!currentUserId) {
      if(!silent) toast({ title: 'Error', description: 'No se pudo identificar al usuario para reenviar el código.', variant: 'destructive' });
      return;
    }
    setIsResending(true);
    const result = await generateAndSendOtpAction(currentUserId);
    setIsResending(false);

    if (result.success) {
      if(!silent) toast({ title: 'Código Reenviado', description: result.message });
      if (result.phone_number_ending) {
        setPhoneNumberEnding(result.phone_number_ending);
      }
    } else {
      if(!silent) toast({ title: 'Error al Reenviar', description: result.message, variant: 'destructive' });
    }
  };

  if (!userId && !searchParams.get('userId')) { // Added check for query param to avoid premature redirect during initial load
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando información de verificación...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SmartphoneNfc className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Verifica tu Número de Teléfono</CardTitle>
          <CardDescription>
            {phoneNumberEnding 
                ? `Hemos enviado un código de 4 dígitos a tu número terminado en ••••${phoneNumberEnding}.`
                : `Estamos intentando enviar un código de verificación a tu teléfono.`
            }
            <br/>
            Ingresa el código a continuación para completar tu registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleVerifyOtp)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Verificación (4 dígitos)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        maxLength={4}
                        placeholder="••••"
                        className="text-center text-2xl tracking-[1em] font-mono h-14"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormDescription>
                      El código expira en {OTP_EXPIRATION_MINUTES} minutos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base" disabled={isVerifying || isResending}>
                {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                Verificar Código
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => handleResendOtp()}
              disabled={isResending || isVerifying}
              className="text-sm"
            >
              {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ¿No recibiste el código? Reenviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
