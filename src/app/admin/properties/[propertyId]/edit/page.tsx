
// src/app/admin/properties/[propertyId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter for back navigation
import { getPropertyByIdForAdminAction } from '@/actions/propertyActions';
import type { PropertyListing } from '@/lib/types';
import AdminEditPropertyForm from '@/components/admin/properties/AdminEditPropertyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminEditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      setIsLoading(true);
      setError(null);
      getPropertyByIdForAdminAction(propertyId)
        .then((data) => {
          if (data) {
            setProperty(data);
          } else {
            setError('No se encontró la propiedad especificada o no tienes permiso para editarla.');
          }
        })
        .catch((err) => {
          console.error("Error fetching property for admin edit:", err);
          setError('Error al cargar los datos de la propiedad.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError('ID de propiedad no válido.');
      setIsLoading(false);
    }
  }, [propertyId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando datos de la propiedad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Propiedad</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin/properties">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión de Propiedades
          </Link>
        </Button>
      </div>
    );
  }

  if (!property) {
    // Should be caught by error state, but as a fallback
    return <p>Propiedad no encontrada.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline">
            Editar Propiedad: <span className="text-primary">{property.title}</span>
          </CardTitle>
          <CardDescription>
            Modifica los detalles de la propiedad. El slug ({property.slug}) no se puede cambiar desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEditPropertyForm property={property} />
        </CardContent>
      </Card>
    </div>
  );
}
