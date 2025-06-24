// src/components/layout/Footer.tsx
import Link from 'next/link';
import { House, Twitter, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <footer className="bg-card text-card-foreground border rounded-2xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Logo y Nombre */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <House className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold text-foreground">konecte</span>
            </Link>
            <p className="text-center md:text-left text-sm text-muted-foreground">
              Tu portal inmobiliario inteligente.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Navegación</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Inicio</Link></li>
                <li><Link href="/properties" className="text-muted-foreground hover:text-foreground transition-colors">Propiedades</Link></li>
                <li><Link href="/requests" className="text-muted-foreground hover:text-foreground transition-colors">Solicitudes</Link></li>
                <li><Link href="/plans" className="text-muted-foreground hover:text-foreground transition-colors">Planes</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">Términos de Servicio</Link></li>
                <li><Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidad</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Social</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><Twitter size={18} /> Twitter</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><Linkedin size={18} /> LinkedIn</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><Github size={18} /> GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-center sm:text-left text-muted-foreground">
            &copy; {new Date().getFullYear()} konecte. Todos los derechos reservados.
          </p>
          <p className="text-sm text-center sm:text-right mt-4 sm:mt-0 text-muted-foreground">
            Diseñado con ♥ en Chile.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
