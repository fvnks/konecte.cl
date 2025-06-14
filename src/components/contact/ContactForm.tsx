
// src/components/contact/ContactForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { contactFormPublicSchema, type ContactFormPublicValues } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitContactFormAction } from '@/actions/contactFormActions';
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

export default function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormPublicValues>({
    resolver: zodResolver(contactFormPublicSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  async function onSubmit(values: ContactFormPublicValues) {
    setIsSubmitting(true);
    const result = await submitContactFormAction(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Mensaje Enviado",
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: "Error al Enviar Mensaje",
        description: result.message || "No se pudo enviar tu mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tu Nombre Completo *</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
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
                <FormLabel>Tu Correo Electrónico *</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tu Teléfono (Opcional)</FormLabel>
                <FormControl>
                    <Input type="tel" placeholder="+56 9 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Asunto (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Consulta sobre propiedad, Soporte técnico" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tu Mensaje *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escribe tu consulta aquí..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar Mensaje
        </Button>
      </form>
    </Form>
  );
}
