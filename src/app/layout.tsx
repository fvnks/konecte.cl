import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppLayout from '@/components/layout/AppLayout';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import StyledComponentsRegistry from '@/lib/styled-components-registry';
import { EditModeProvider } from '@/lib/EditModeContext';

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
      </head>
      <body className="font-body"> 
        <StyledComponentsRegistry>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            <EditModeProvider>
            <AppLayout>
              {children}
            </AppLayout>
            </EditModeProvider>
            <Toaster />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
