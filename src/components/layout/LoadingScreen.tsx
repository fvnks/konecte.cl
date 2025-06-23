// src/components/layout/LoadingScreen.tsx
'use client';
import CustomPageLoader from '@/components/ui/CustomPageLoader';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-black">
      <CustomPageLoader />
    </div>
  );
}
