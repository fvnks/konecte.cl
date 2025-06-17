
// src/app/dashboard/my-listings/property/[propertyId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPropertyByIdForAdminAction, userUpdatePropertyAction } from '@/actions/propertyActions'; // Usamos getPropertyByIdForAdminAction por ahora
import type { PropertyListing, User as StoredUser, PropertyFormValues, SubmitPropertyResult } from '@/lib/types';
import EditPropertyForm from '@/components/property/EditPropertyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UserEditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = no verificado, true = autorizado, false = no autorizado

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (e) {
        setError("Error al verificar tu sesión. Por favor, inicia sesión de nuevo.");
        setIsLoading(false);
        setIsAuthorized(false);
      }
    } else {
      setError("Debes iniciar sesión para editar tus propiedades.");
      setIsLoading(false);
      setIsAuthorized(false);
    }
  }, []);

  useEffect(() => {
    if (propertyId && loggedInUser) {
      setIsLoading(true);
      setError(null);
      getPropertyByIdForAdminAction(propertyId) // Esta acción no verifica propiedad, lo haremos aquí
        .then((data) => {
          if (data) {
            if (data.user_id === loggedInUser.id) {
              setProperty(data);
              setIsAuthorized(true);
            } else {
              setError('No tienes permiso para editar esta propiedad.');
              setIsAuthorized(false);
            }
          } else {
            setError('No se encontró la propiedad especificada.');
            setIsAuthorized(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching property for user edit:", err);
          setError('Error al cargar los datos de la propiedad.');
          setIsAuthorized(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!loggedInUser && !isLoading) { // Si el chequeo inicial de loggedInUser falla.
        setIsLoading(false);
        // El error ya se habrá seteado en el primer useEffect
    }
  }, [propertyId, loggedInUser, isLoading]); // Re-ejecutar si loggedInUser cambia (aunque es improbable después de la carga inicial)

  const handleUserSubmit = async (
    id: string, 
    data: PropertyFormValues
    // userId no es necesario pasarlo explícitamente aquí ya que lo tenemos de loggedInUser
  ): Promise<SubmitPropertyResult> => {
    if (!loggedInUser?.id) {
        return { success: false, message: "Error de autenticación."};
    }
    return userUpdatePropertyAction(loggedInUser.id, id, data);
  };

  if (isLoading || isAuthorized === null) { // Muestra loader mientras se verifica auth y se cargan datos
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando y verificando...</p>
      </div>
    );
  }

  if (!isAuthorized || error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso Denegado o Error</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {error || "No tienes permiso para acceder a esta página o la propiedad no existe."}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/my-listings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Publicaciones
          </Link>
        </Button>
      </div>
    );
  }

  if (!property) { // Debería ser cubierto por !isAuthorized, pero como fallback.
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Propiedad No Encontrada</h2>
             <Button asChild variant="outline">
                <Link href="/dashboard/my-listings">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Publicaciones
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline">
            Editar Mi Propiedad: <span className="text-primary">{property.title}</span>
          </CardTitle>
          <CardDescription>
            Modifica los detalles de tu propiedad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditPropertyForm 
            property={property} 
            userId={loggedInUser.id} // Pasar userId para la acción
            onSubmitAction={(id, data, uid) => handleUserSubmit(id, data)} // Pasar la acción de usuario
            isAdminContext={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
