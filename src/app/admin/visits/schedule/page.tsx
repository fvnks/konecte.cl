'use client';

import { useState, useEffect } from 'react';
import ScheduleVisitForm from '@/components/visits/ScheduleVisitForm';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/lib/types';

export default function AdminScheduleVisitPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En un caso real, esto debería tener una verificación de rol más robusta.
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const parsedUser = JSON.parse(userJson);
        if (parsedUser.role_id === 'admin') {
          setAdminUser(parsedUser);
        }
      } catch (e) {
        console.error("Failed to parse admin user from localStorage", e);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-8 mt-8">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <div>Debes iniciar sesión como administrador para acceder a esta página.</div>;
  }

  return (
    <ScheduleVisitForm 
      loggedInUserId={adminUser.id}
      userRole="admin"
    />
  );
} 