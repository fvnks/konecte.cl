
// src/components/property/PropertyInquiryForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { propertyInquiryFormSchema, type PropertyInquiryFormValues, type User as StoredUser } from '@/lib/types';
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
import { submitPropertyInquiryAction } from '@/actions/leadTrackingActions';
import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface PropertyInquiryFormProps {
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
}

export default function PropertyInquiryForm({ propertyId, propertyOwnerId, propertyTitle }: PropertyInquiryFormProps) {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage for inquiry form", error);
      }
    }
  }, []);

  const form = useForm<PropertyInquiryFormValues>({
    resolver: zodResolver(propertyInquiryFormSchema),
    defaultValues: {
      name: loggedInUser?.name || '',
      email: loggedInUser?.email || '',
      phone: loggedInUser?.phone_number || '',
      message: `Hola, estoy interesado/a en la propiedad "${propertyTitle}". Me gustaría más información.`,
    },
  });

  useEffect(() => {
    // Pre-fill form if user logs in after component mounts or user data changes
    if (loggedInUser) {
      form.reset({
        name: loggedInUser.name || '',
        email: loggedInUser.email || '',
        phone: loggedInUser.phone_number || '',
        message: `Hola, estoy interesado/a en la propiedad "${propertyTitle}". Me gustaría más información.`,
      });
    }
  }, [loggedInUser, form, propertyTitle]);

  async function onSubmit(values: PropertyInquiryFormValues) {
    setIsSubmitting(true);
    const result = await submitPropertyInquiryAction(
      propertyId,
      propertyOwnerId,
      values,
      loggedInUser?.id
    );
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Consulta Enviada",
        description: "Tu mensaje ha sido enviado al anunciante.",
      });
      form.reset({
         name: loggedInUser?.name || '',
         email: loggedInUser?.email || '',
         phone: loggedInUser?.phone_number || '',
         message: `Hola, estoy interesado/a en la propiedad "${propertyTitle}". Quisiera coordinar una visita.` // Reset message to something new
      });
    } else {
      toast({
        title: "Error al Enviar Consulta",
        description: result.message || "No se pudo enviar tu consulta. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl lg:text-2xl font-headline">Contactar al Anunciante</CardTitle>
        <CardDescription>Envía un mensaje sobre la propiedad: {propertyTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe tu consulta aquí..."
                      className="min-h-[100px]"
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
      </CardContent>
    </Card>
  );
}
