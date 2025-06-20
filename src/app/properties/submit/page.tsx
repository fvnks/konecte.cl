// src/app/properties/submit/page.tsx
'use client'; // Ensure this page is a client component for dynamic import usage

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import PropertyForm from "@/components/property/PropertyForm"; // Original static import
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PropertyFormWithNoSSR = dynamic(
  () => import('@/components/property/PropertyForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Cargando formulario de publicación...</p>
      </div>
    )
  }
);

export default function SubmitPropertyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Publica Tu Propiedad</CardTitle>
          <CardDescription className="text-center text-lg">
            Completa los detalles a continuación para listar tu propiedad en venta o arriendo en PropSpot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <PropertyFormWithNoSSR />
        </CardContent>
      </Card>
    </div>
  );
}
