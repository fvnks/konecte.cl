'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { bugReportFormSchema, type BugReportFormValues } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitBugReportAction } from '@/actions/bugReportActions';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BugReportForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: {
      name: '',
      email: '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      description: '',
      stepsToReproduce: '',
      browserDevice: typeof window !== 'undefined' ? navigator.userAgent : '',
    },
  });

  async function onSubmit(values: BugReportFormValues) {
    setIsSubmitting(true);
    
    try {
      const result = await submitBugReportAction(values);
      
      if (result.success) {
        setSubmitSuccess(true);
        toast({
          title: '¡Reporte enviado!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un error al enviar tu reporte. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 font-medium">¡Reporte enviado con éxito!</AlertTitle>
        <AlertDescription className="text-green-700">
          Gracias por ayudarnos a mejorar. Tu reporte ha sido recibido y será revisado por nuestro equipo.
        </AlertDescription>
        <Button 
          variant="outline" 
          className="mt-4 border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
          onClick={() => setSubmitSuccess(false)}
        >
          Enviar otro reporte
        </Button>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} />
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
                <FormLabel>Correo electrónico (opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormDescription>
                  Para poder contactarte si necesitamos más información
                </FormDescription>
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
              <FormLabel>URL de la página</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/pagina-con-error" {...field} />
              </FormControl>
              <FormDescription>
                Dirección web donde encontraste el error
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción del error</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe el problema que encontraste con el mayor detalle posible" 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stepsToReproduce"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pasos para reproducir (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="1. Hice clic en...\n2. Luego ingresé...\n3. Después..." 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enumera los pasos para que podamos reproducir el error
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="browserDevice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navegador y dispositivo (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Chrome 98 en Windows 10" {...field} />
              </FormControl>
              <FormDescription>
                Información sobre tu navegador y sistema operativo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800">Información importante</AlertTitle>
          <AlertDescription className="text-blue-700">
            Los reportes de errores nos ayudan a mejorar la plataforma. Agradecemos tu contribución.
          </AlertDescription>
        </Alert>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </form>
    </Form>
  );
} 