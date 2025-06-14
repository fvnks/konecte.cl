
// src/components/lead-tracking/RecordView.tsx
'use client';

import { useEffect, useState } from 'react';
import { recordPropertyViewAction } from '@/actions/leadTrackingActions';
import type { User as StoredUserType } from '@/lib/types';

interface RecordViewProps {
  propertyId: string;
}

export default function RecordView({ propertyId }: RecordViewProps) {
  const [loggedInUser, setLoggedInUser] = useState<StoredUserType | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        setLoggedInUser(JSON.parse(userJson));
      } catch (error) {
        console.error("Error parsing user for RecordView:", error);
      }
    }
  }, []);

  useEffect(() => {
    let viewRecorded = false; // Para asegurar que se registre solo una vez por carga de componente

    const recordView = async () => {
      if (propertyId && !viewRecorded) {
        try {
          // Intentaremos obtener la IP y User-Agent del lado del cliente, aunque esto puede ser limitado.
          // Para un seguimiento más robusto de IP, se haría en el servidor, pero eso requiere
          // pasar la request o headers a la Server Action, lo cual es más complejo.
          // Por ahora, nos enfocamos en el user_id si está disponible.
          
          // NOTA: Obtener IP pública desde el cliente es difícil y no fiable.
          // Se omite por ahora para simplificar. El user_agent se puede obtener.
          const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

          await recordPropertyViewAction(propertyId, loggedInUser?.id, undefined, userAgent);
          viewRecorded = true; // Marcar como registrada para esta instancia del componente
        } catch (error) {
          console.error("Error recording property view:", error);
        }
      }
    };

    recordView();
  }, [propertyId, loggedInUser]); // Depende de propertyId y loggedInUser

  return null; // Este componente no renderiza nada visible
}
