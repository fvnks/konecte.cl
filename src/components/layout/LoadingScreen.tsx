// src/components/layout/LoadingScreen.tsx
'use client';
import CustomPageLoader from '@/components/ui/CustomPageLoader';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1e1a36]">
      <CustomPageLoader />
      <p className="text-white/80 text-lg font-medium absolute top-[calc(50%+120px)]">
        Cargando Konecte...
      </p>
    </div>
  );
}