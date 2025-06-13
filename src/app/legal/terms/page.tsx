
// src/app/legal/terms/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <ScrollText className="h-8 w-8 mr-3 text-primary" />
            Términos y Condiciones del Servicio
          </CardTitle>
          <CardDescription>
            Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose prose-sm sm:prose-base max-w-none">
          <p>
            Bienvenido a PropSpot (en adelante, "la Plataforma", "nosotros", "nuestro"). Al acceder o utilizar nuestra plataforma, aceptas estar sujeto a estos Términos y Condiciones del Servicio ("Términos"). Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">1. Uso de la Plataforma</h2>
          <p>
            Debes tener al menos 18 años para utilizar esta Plataforma. Eres responsable de cualquier actividad que ocurra bajo tu nombre de usuario y de mantener la seguridad de tu cuenta.
            No puedes usar la Plataforma para ningún propósito ilegal o no autorizado.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">2. Contenido del Usuario</h2>
          <p>
            Eres el único responsable del contenido que publicas en la Plataforma, incluyendo listados de propiedades, solicitudes y comentarios ("Contenido del Usuario"). Al publicar Contenido del Usuario, nos otorgas una licencia mundial, no exclusiva, libre de regalías, para usar, reproducir, modificar y distribuir tu Contenido del Usuario en conexión con la operación de la Plataforma.
          </p>
          <p>
            Nos reservamos el derecho de eliminar cualquier Contenido del Usuario que consideremos, a nuestra sola discreción, que viola estos Términos o es de alguna manera perjudicial.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">3. Propiedad Intelectual</h2>
          <p>
            La Plataforma y su contenido original (excluyendo el Contenido del Usuario), características y funcionalidad son y seguirán siendo propiedad exclusiva de PropSpot y sus licenciantes.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">4. Limitación de Responsabilidad</h2>
          <p>
            En ningún caso PropSpot, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, entre otros, pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de (i) tu acceso o uso o incapacidad para acceder o usar la Plataforma; (ii) cualquier conducta o contenido de terceros en la Plataforma.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">5. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que los nuevos términos entren en vigor. Lo que constituye un cambio material se determinará a nuestra sola discreción.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">6. Ley Aplicable</h2>
          <p>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de Chile, sin tener en cuenta sus disposiciones sobre conflicto de leyes.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">7. Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre estos Términos, por favor contáctanos a [email de contacto o formulario].
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
