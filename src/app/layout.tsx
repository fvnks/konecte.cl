
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppLayout from '@/components/layout/AppLayout';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import StyledComponentsRegistry from '@/lib/styled-components-registry';
import Script from 'next/script'; // Importar Script

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', 
});

export const metadata: Metadata = {
  title: 'konecte - Encuentra Tu Próxima Propiedad',
  description: 'Descubre, publica y comenta propiedades en arriendo o venta.',
  icons: {
    icon: [], 
    shortcut: [], 
    apple: [], 
    other: [], 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Cargar el script de Google Maps API para Places Autocomplete */}
        {/* Asegúrate de que NEXT_PUBLIC_GOOGLE_PLACES_API_KEY esté definida en tu .env */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places&callback=Function.prototype`}
          strategy="beforeInteractive" // Cargar antes de que la página sea interactiva
          async
          defer
        />
      </head>
      <body className="font-body"> 
        <StyledComponentsRegistry>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
