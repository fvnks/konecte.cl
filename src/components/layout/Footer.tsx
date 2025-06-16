// src/components/layout/Footer.tsx
import Link from 'next/link'; 

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto shadow-inner"> 
      <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-4 py-8 sm:flex-row sm:px-6 lg:px-8 sm:py-10"> 
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} konecte. Todos los derechos reservados.
        </p>
        <div className="flex gap-5 sm:gap-6"> 
          <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150">Términos de Servicio</Link>
          <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150">Política de Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
```