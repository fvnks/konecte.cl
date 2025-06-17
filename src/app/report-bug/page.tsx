
// src/app/report-bug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertOctagon, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitBugReportAction } from '@/actions/bugReportActions';
import { bugReportFormSchema, type BugReportFormValues, type User as StoredUser } from '@/lib/types';
import Link from 'next/link';

export default function ReportBugPage() {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [browserInfo, setBrowserInfo] = useState('');

  useEffect(() => {
    // Prefill user info if logged in
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage for bug report:", error);
      }
    }
    // Get browser info
    if (typeof window !== 'undefined') {
      setBrowserInfo(navigator.userAgent);
    }
  }, []);

  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: {
      name: loggedInUser?.name || '',
      email: loggedInUser?.email || '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      description: '',
      stepsToReproduce: '',
      browserDevice: browserInfo || '',
    },
  });

  useEffect(() => {
    // Update form defaults if user/browser info becomes available after initial render
    form.reset({
      name: loggedInUser?.name || '',
      email: loggedInUser?.email || '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      description: form.getValues('description') || '', // Keep existing user input
      stepsToReproduce: form.getValues('stepsToReproduce') || '',
      browserDevice: browserInfo || '',
    });
  }, [loggedInUser, browserInfo, form]);

  async function onSubmit(values: BugReportFormValues) {
    setIsSubmitting(true);
    const result = await submitBugReportAction(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Reporte Enviado",
        description: result.message,
      });
      form.reset({
        name: loggedInUser?.name || '',
        email: loggedInUser?.email || '',
        pageUrl: '', // Clear page URL after successful submission
        description: '',
        stepsToReproduce: '',
        browserDevice: browserInfo || '',
      });
    } else {
      toast({
        title: "Error al Enviar Reporte",
        description: result.message || "No se pudo enviar tu reporte. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <AlertOctagon className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="text-3xl font-headline">Reportar un Error</CardTitle>
          <CardDescription className="text-lg">
            Ayúdanos a mejorar PropSpot informándonos sobre cualquier problema que encuentres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Nombre (Opcional)</FormLabel>
                      <FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Correo Electrónico (Opcional)</FormLabel>
                      <FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Página (Opcional)</FormLabel>
                    <FormControl><Input type="url" placeholder="https://propspot.app/ruta/con/error" {...field} /></FormControl>
                    <FormDescription>Si el error ocurrió en una página específica, pégala aquí.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del Error *</FormLabel>
                    <FormControl><Textarea placeholder="Describe el problema que encontraste de la forma más detallada posible..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stepsToReproduce"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasos para Reproducir (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="1. Fui a...\n2. Hice clic en...\n3. Ocurrió el error..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormDescription>Si sabes cómo reproducir el error, descríbelo aquí.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="browserDevice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navegador y Dispositivo (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Ej: Chrome 123 en Windows 10, Safari en iPhone 15 Pro" className="min-h-[60px]" {...field} /></FormControl>
                    <FormDescription>Esta información nos ayuda a diagnosticar el problema.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Enviar Reporte
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
