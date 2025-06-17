
// src/components/layout/Footer.tsx
import Link from 'next/link'; 
import BugReportButton from '@/components/ui/BugReportButton'; // Import the new button

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto shadow-inner"> 
      <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 py-8 sm:flex-row sm:px-6 lg:px-8 sm:py-10"> 
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} konecte. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 sm:gap-5"> {/* Changed gap for better spacing with icon button */}
          <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150">Términos de Servicio</Link>
          <BugReportButton /> {/* Add the bug report button here */}
          <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150">Política de Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
