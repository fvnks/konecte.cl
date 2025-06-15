// src/components/broker/ProposePropertyDialog.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { proposePropertyFormSchema, type ProposePropertyFormValues, type SearchRequest, type User as StoredUserType, type PropertyListing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { proposePropertyForRequestAction } from '@/actions/brokerCollaborationActions';
import { Loader2, Send, Building, UserCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ProposePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRequest: SearchRequest;
  offeringBroker: StoredUserType; // Logged-in user
  userProperties: PropertyListing[];
  isLoadingUserProperties: boolean;
  onProposalSubmitted: () => void;
}

export default function ProposePropertyDialog({
  open,
  onOpenChange,
  targetRequest,
  offeringBroker,
  userProperties,
  isLoadingUserProperties,
  onProposalSubmitted,
}: ProposePropertyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProposePropertyFormValues>({
    resolver: zodResolver(proposePropertyFormSchema),
    defaultValues: {
      selectedPropertyId: '',
      commission_terms: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        selectedPropertyId: '',
        commission_terms: `Propongo un canje estándar para esta colaboración (ej: 50/50 sobre comisión total). Detalles a confirmar.`,
      });
    }
  }, [open, form, targetRequest]);

  async function onSubmit(values: ProposePropertyFormValues) {
    if (!offeringBroker?.id || !targetRequest?.user_id || !targetRequest?.id) {
      toast({ title: 'Error', description: 'Faltan datos para procesar la propuesta.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = await proposePropertyForRequestAction(
      targetRequest.id, // propertyRequestId
      targetRequest.user_id, // requestingBrokerId (owner of the request)
      offeringBroker.id, // offeringBrokerId (current logged-in user)
      values
    );
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Propuesta Enviada',
        description: result.message || 'Tu propuesta de colaboración ha sido enviada.',
      });
      onProposalSubmitted();
      onOpenChange(false);
    } else {
      toast({
        title: 'Error al Enviar Propuesta',
        description: result.message || 'No se pudo enviar tu propuesta. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }
  
  if (!offeringBroker || !targetRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Building className="mr-2 h-5 w-5 text-primary" />
            Proponer Propiedad para:
          </DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-medium text-foreground block truncate" title={targetRequest.title}>
              "{targetRequest.title}"
            </span>
            <span className="text-xs text-muted-foreground">
              Solicitud de: {targetRequest.author?.name || 'Otro Corredor'}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="selectedPropertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecciona tu Propiedad a Ofrecer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingUserProperties || userProperties.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingUserProperties ? "Cargando tus propiedades..." 
                            : userProperties.length === 0 ? "No tienes propiedades activas" 
                            : "Elige una de tus propiedades"
                        }/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className="max-h-60">
                        {userProperties.map(prop => (
                          <SelectItem key={prop.id} value={prop.id} className="text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium">{prop.title}</span>
                                <span className="text-xs text-muted-foreground">{prop.city} - {prop.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {userProperties.length === 0 && !isLoadingUserProperties && (
                     <FormDescription className="text-orange-600">
                       Debes tener al menos una propiedad activa para proponer. 
                       <Link href="/properties/submit" className="underline ml-1">Publica una aquí</Link>.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commission_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Términos de Comisión Propuestos (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Propongo 50/50 de la comisión total. Abierto a discutir."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Describe brevemente tu propuesta de reparto de comisión.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingUserProperties || userProperties.length === 0 || !form.getValues("selectedPropertyId")}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Propuesta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```