
// src/app/auth/verify-phone/page.tsx
'use client';

import { useEffect, useState, FormEvent, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, SmartphoneNfc, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateAndSendOtpAction, verifyOtpAction } from '@/actions/otpActions';
import { otpVerificationSchema, type OtpVerificationFormValues, User as StoredUser } from '@/lib/types';
import Link from 'next/link';

const OTP_EXPIRATION_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumberEnding, setPhoneNumberEnding] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: '',
    },
  });
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoadingPage]); // Focus when page is done loading

  const startResendCooldown = () => {
    setCanResend(false);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current!);
          cooldownIntervalRef.current = null;
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = useCallback(async (currentUserIdToResend: string | null = userId, silent = false) => {
    if (!currentUserIdToResend) {
      if (!silent) toast({ title: 'Error', description: 'No se pudo identificar al usuario para reenviar el código.', variant: 'destructive' });
      return;
    }
    setIsResending(true);
    const result = await generateAndSendOtpAction(currentUserIdToResend);
    setIsResending(false);

    if (result.success) {
      if (!silent) {
        toast({ title: 'Código Reenviado', description: result.message });
        startResendCooldown();
      }
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
        handleResendOtp(userIdFromQuery, true); // Attempt to get it silently
      }
      setIsLoadingPage(false);
    } else {
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          const user: StoredUser = JSON.parse(userJson);
          if (user.id && !user.phone_verified) {
            setUserId(user.id);
            if (user.phone_number) {
              setPhoneNumberEnding(user.phone_number.slice(-4));
            } else {
              handleResendOtp(user.id, true);
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
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
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

  if (!userId) {
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
                        ref={inputRef}
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
              <Button type="submit" className="w-full h-12 text-base" disabled={isVerifying || isResending || !canResend && resendCooldown > 0}>
                {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                Verificar Código
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => handleResendOtp()}
              disabled={isResending || isVerifying || !canResend}
              className="text-sm"
            >
              {(isResending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!canResend && resendCooldown > 0 
                ? `Reenviar en ${resendCooldown}s` 
                : (isResending ? 'Reenviando...' : '¿No recibiste el código? Reenviar')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

