
// src/app/auth/verify-phone/page.tsx
'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react'; // Added useCallback
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, SmartphoneNfc, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useToast } from '@/hooks/use-toast';
import { generateAndSendOtpAction, verifyOtpAction } from '@/actions/otpActions';
import { otpVerificationSchema, type OtpVerificationFormValues, User as StoredUser } from '@/lib/types'; // Import StoredUser
import Link from 'next/link';

const OTP_EXPIRATION_MINUTES = 5; // Duplicated from otpActions for display, consider centralizing

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumberEnding, setPhoneNumberEnding] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleResendOtp = useCallback(async (currentUserIdToResend: string | null = userId, silent = false) => {
    if (!currentUserIdToResend) {
      if (!silent) toast({ title: 'Error', description: 'No se pudo identificar al usuario para reenviar el código.', variant: 'destructive' });
      return;
    }
    setIsResending(true);
    const result = await generateAndSendOtpAction(currentUserIdToResend);
    setIsResending(false);

    if (result.success) {
      if (!silent) toast({ title: 'Código Reenviado', description: result.message });
      if (result.phone_number_ending) {
        setPhoneNumberEnding(result.phone_number_ending);
      }
    } else {
      if (!silent) toast({ title: 'Error al Reenviar', description: result.message, variant: 'destructive' });
    }
  }, [userId, toast]);


  useEffect(() => {
    setIsLoadingPage(true);
    const userIdFromQuery = searchParams.get('userId');
    const phoneEndingFromQuery = searchParams.get('phoneEnding');

    if (userIdFromQuery) {
      setUserId(userIdFromQuery);
      if (phoneEndingFromQuery) {
        setPhoneNumberEnding(phoneEndingFromQuery);
      } else {
        // If userId is from query but phoneEnding isn't, try to get it.
        handleResendOtp(userIdFromQuery, true);
      }
      setIsLoadingPage(false);
    } else {
      // If no userId in query, check localStorage for a logged-in, unverified user
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const user: StoredUser = JSON.parse(userJson);
          if (user.id && !user.phone_verified) {
            setUserId(user.id);
            // Try to get phone ending by "resending" OTP (silently if first load and no query param)
             if (user.phone_number) {
                setPhoneNumberEnding(user.phone_number.slice(-4));
             } else {
                handleResendOtp(user.id, true); // Attempt to get it via resend
             }
          } else if (user.id && user.phone_verified) {
            toast({ title: "Teléfono ya verificado", description: "Tu número de teléfono ya ha sido verificado." });
            router.push('/dashboard');
          } else {
             setError("No se pudo determinar el usuario para la verificación. Por favor, inicia sesión de nuevo.");
          }
        } catch (e) {
          console.error("Error parsing user for OTP page", e);
          setError("Error al procesar la información del usuario.");
        }
      } else {
        setError("No se encontró información de usuario para la verificación. Por favor, inicia sesión.");
      }
      setIsLoadingPage(false);
    }
  }, [searchParams, router, toast, handleResendOtp]);


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
      router.push('/dashboard');
    } else {
      toast({ title: 'Error de Verificación', description: result.message, variant: 'destructive' });
      form.setError("otp", { type: "manual", message: result.message });
    }
  };


  if (isLoadingPage) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando información de verificación...</p>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error de Verificación</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild><Link href="/auth/signin">Ir a Iniciar Sesión</Link></Button>
      </div>
    );
  }

  if (!userId) { // Should be caught by error state, but as a fallback
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Usuario No Identificado</h2>
            <p className="text-muted-foreground mb-4">No pudimos identificar tu cuenta para la verificación.</p>
            <Button asChild><Link href="/auth/signin">Ir a Iniciar Sesión</Link></Button>
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
                : `Se ha enviado un código de verificación a tu teléfono registrado.`
            }
            <br/>
            Ingresa el código a continuación para completar tu registro o verificación.
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
