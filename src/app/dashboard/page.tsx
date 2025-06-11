
// src/app/dashboard/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestCard from '@/components/request/RequestCard';
import { sampleProperties, sampleRequests, placeholderUser } from '@/lib/types';
import type { PropertyListing, SearchRequest } from '@/lib/types';

// Simulación: En una app real, obtendrías estos datos del usuario autenticado desde tu backend.
async function getUserProperties(): Promise<PropertyListing[]> {
  // Filtra las propiedades para que solo muestre las del placeholderUser
  return sampleProperties.filter(prop => prop.author.id === placeholderUser.id);
}

async function getUserRequests(): Promise<SearchRequest[]> {
  // Filtra las solicitudes para que solo muestre las del placeholderUser
  return sampleRequests.filter(req => req.author.id === placeholderUser.id);
}

export default async function DashboardPage() {
  const userProperties = await getUserProperties();
  const userRequests = await getUserRequests();

  // Simulación de nombre de usuario, en una app real vendría de la sesión.
  const userName = placeholderUser.name;

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-headline">Panel de {userName}</CardTitle>
              <CardDescription className="text-lg">Bienvenido de nuevo. Aquí puedes gestionar tus publicaciones.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button asChild size="lg" variant="outline">
            <Link href="/properties/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Nueva Propiedad
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/requests/submit" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Publicar Nueva Solicitud
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <ListTree className="h-6 w-6 text-primary" /> Mis Propiedades Publicadas ({userProperties.length})
            </CardTitle>
            <CardDescription>Gestiona las propiedades que has listado en PropSpot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userProperties.length > 0 ? (
              userProperties.map(property => (
                <PropertyListItem key={property.id} property={property} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-2" />
                <p>Aún no has publicado ninguna propiedad.</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/properties/submit">¡Publica tu primera propiedad!</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <SearchCheck className="h-6 w-6 text-primary" /> Mis Solicitudes Activas ({userRequests.length})
            </CardTitle>
            <CardDescription>Revisa y gestiona tus solicitudes de búsqueda de propiedades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userRequests.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <SearchCheck className="h-12 w-12 mx-auto mb-2" />
                <p>No tienes solicitudes de propiedad activas.</p>
                 <Button asChild variant="link" className="mt-2">
                  <Link href="/requests/submit">¡Crea tu primera solicitud!</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
