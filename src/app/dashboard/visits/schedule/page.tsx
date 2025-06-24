'use client';

import { useState, useEffect } from 'react';
import ScheduleVisitForm from '@/components/visits/ScheduleVisitForm';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/lib/types';

export default function UserScheduleVisitPage() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
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

  if (!loggedInUser) {
    return <div>Debes iniciar sesión para agendar una visita.</div>;
  }

  return (
    <ScheduleVisitForm 
      loggedInUserId={loggedInUser.id}
      userRole="user"
    />
  );
} 