// src/app/profile/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, UserCog, AlertTriangle } from 'lucide-react';
import EditProfileForm from '@/components/profile/EditProfileForm';
import type { User as StoredUser } from '@/lib/types';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Cargando perfil para editar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Acceso Requerido</h2>
        <p className="text-muted-foreground mb-6">Debes iniciar sesión para editar tu perfil.</p>
        <Button asChild>
          <Link href="/auth/signin?redirect=/profile/edit">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="self-start">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center">
            <UserCog className="h-7 w-7 mr-3 text-primary" />
            Editar Mi Perfil
          </CardTitle>
          <CardDescription>
            Actualiza tu información personal y de contacto. El correo y el RUT no se pueden cambiar aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
