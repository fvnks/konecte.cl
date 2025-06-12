export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto"> {/* mt-auto para asegurar que esté al final si el contenido es corto */}
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8"> {/* Aumentar padding y gap */}
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PropSpot. Todos los derechos reservados.
        </p>
        <div className="flex gap-6"> {/* Aumentar gap */}
          <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Términos de Servicio</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Política de Privacidad</a>
        </div>
      </div>
    </footer>
  );
}
