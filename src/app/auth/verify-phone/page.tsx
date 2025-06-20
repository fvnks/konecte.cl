// src/app/auth/verify-phone/page.tsx
import React, { Suspense } from 'react';
import VerifyPhoneClientContent from '@/components/auth/VerifyPhoneClientContent';
import { Loader2 } from 'lucide-react';

// Simple loader component for Suspense fallback
function VerifyPhonePageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando verificación...</p>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<VerifyPhonePageLoader />}>
      <VerifyPhoneClientContent />
    </Suspense>
  );
}
