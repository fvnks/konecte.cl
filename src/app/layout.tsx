
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppLayout from '@/components/layout/AppLayout';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // This will create a CSS variable
});

export const metadata: Metadata = {
  title: 'PropSpot - Encuentra Tu Próxima Propiedad',
  description: 'Descubre, publica y comenta propiedades en arriendo o venta.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={`${inter.variable}`}>
      {/* The <head> tag is automatically managed by Next.js.
          Font links are handled by next/font.
          Other metadata comes from the 'metadata' export. */}
      <body className="font-body antialiased">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
