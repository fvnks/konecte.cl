
// src/app/admin/requests/[requestId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRequestByIdForAdminAction } from '@/actions/requestActions';
import type { SearchRequest } from '@/lib/types';
import AdminEditRequestForm from '@/components/admin/requests/AdminEditRequestForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, FileSearch } from 'lucide-react';
import Link from 'next/link';

export default function AdminEditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<SearchRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      setIsLoading(true);
      setError(null);
      getRequestByIdForAdminAction(requestId)
        .then((data) => {
          if (data) {
            setRequest(data);
          } else {
            setError('No se encontró la solicitud especificada o no tienes permiso para editarla.');
          }
        })
        .catch((err) => {
          console.error("Error fetching request for admin edit:", err);
          setError('Error al cargar los datos de la solicitud.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError('ID de solicitud no válido.');
      setIsLoading(false);
    }
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando datos de la solicitud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Solicitud</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin/requests">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión de Solicitudes
          </Link>
        </Button>
      </div>
    );
  }

  if (!request) {
    return <p>Solicitud no encontrada.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-start">
            <FileSearch className="h-7 w-7 mr-3 text-primary flex-shrink-0 mt-1" />
            <div>
                Editar Solicitud: <span className="text-primary block sm:inline">{request.title}</span>
            </div>
          </CardTitle>
          <CardDescription>
            Modifica los detalles de la solicitud de búsqueda. El slug ({request.slug}) no se puede cambiar desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEditRequestForm request={request} />
        </CardContent>
      </Card>
    </div>
  );
}
