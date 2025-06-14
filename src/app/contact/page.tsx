
// src/app/contact/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ContactForm from "@/components/contact/ContactForm"; // Importar el nuevo formulario

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 md:py-12">
      <Card className="shadow-xl rounded-xl border">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl md:text-4xl font-headline">
            Ponte en Contacto
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            ¿Tienes preguntas o necesitas ayuda? Completa el formulario o usa nuestros otros canales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10 pt-6 px-4 md:px-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-center flex items-center justify-center">
              <MessageCircle className="h-6 w-6 mr-2 text-primary" /> Envíanos un Mensaje
            </h2>
            <ContactForm />
          </section>
          
          <Separator />

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                Correo Electrónico
              </h3>
              <p className="text-muted-foreground">
                Para consultas generales:
                <a href="mailto:info@konecte.cl" className="block text-primary hover:underline font-medium">
                  info@konecte.cl
                </a>
              </p>
              <p className="text-muted-foreground">
                Para soporte técnico:
                <a href="mailto:soporte@konecte.cl" className="block text-primary hover:underline font-medium">
                  soporte@konecte.cl
                </a>
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                Teléfono
              </h3>
              <p className="text-muted-foreground">
                Llámanos al:
                <a href="tel:+56912345678" className="block text-primary hover:underline font-medium">
                  +56 9 1234 5678
                </a>
                <span className="block text-xs">(Lunes a Viernes, 9am - 6pm, Hora Chile Continental)</span>
              </p>
            </div>
          </section>
          
          <Separator />

          <section className="space-y-3 text-center">
            <h3 className="text-xl font-semibold flex items-center justify-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Nuestra Oficina (Próximamente)
            </h3>
            <p className="text-muted-foreground">
              Avenida Siempre Viva 742, Springfield, Chile.
            </p>
            <p className="text-xs text-muted-foreground">
              (Por favor, coordina una visita antes de venir)
            </p>
          </section>

          <Separator />
          
          <div className="text-center pt-4">
            <p className="text-muted-foreground mb-4">
              También puedes explorar nuestras <Link href="/faq" className="text-primary hover:underline">Preguntas Frecuentes</Link> para obtener respuestas rápidas.
            </p>
            <Button asChild size="lg">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
