
// src/app/legal/privacy/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <ShieldCheck className="h-8 w-8 mr-3 text-primary" />
            Política de Privacidad
          </CardTitle>
          <CardDescription>
            Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose prose-sm sm:prose-base max-w-none">
          <p>
            En PropSpot (en adelante, "la Plataforma", "nosotros", "nuestro"), valoramos tu privacidad y nos comprometemos a proteger tu información personal. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestra plataforma.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">1. Información que Recopilamos</h2>
          <p>
            Podemos recopilar información personal tuya de diversas maneras, incluyendo:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Información que nos proporcionas directamente:</strong> Cuando te registras, publicas contenido (propiedades, solicitudes, comentarios), o te comunicas con nosotros, podemos recopilar tu nombre, dirección de correo electrónico, número de teléfono, y cualquier otra información que elijas proporcionar.</li>
            <li><strong>Información recopilada automáticamente:</strong> Cuando accedes a la Plataforma, podemos recopilar automáticamente cierta información sobre tu dispositivo y uso, como tu dirección IP, tipo de navegador, sistema operativo, páginas visitadas y fechas/horas de acceso.</li>
          </ul>

          <h2 className="text-xl font-semibold text-card-foreground">2. Uso de tu Información</h2>
          <p>
            Usamos la información que recopilamos para:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveer, operar y mantener nuestra Plataforma.</li>
            <li>Mejorar, personalizar y expandir nuestra Plataforma.</li>
            <li>Entender y analizar cómo utilizas nuestra Plataforma.</li>
            <li>Desarrollar nuevos productos, servicios, características y funcionalidades.</li>
            <li>Comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios, incluso para servicio al cliente, para proporcionarte actualizaciones y otra información relacionada con la Plataforma, y para fines de marketing y promoción.</li>
            <li>Procesar tus transacciones.</li>
            <li>Enviarte correos electrónicos.</li>
            <li>Prevenir el fraude.</li>
          </ul>

          <h2 className="text-xl font-semibold text-card-foreground">3. Divulgación de tu Información</h2>
          <p>
            No compartiremos tu información personal con terceros excepto como se describe en esta Política de Privacidad o con tu consentimiento. Podemos compartir información con:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveedores de servicios que realizan funciones en nuestro nombre.</li>
            <li>Si es requerido por ley o en respuesta a solicitudes válidas por autoridades públicas.</li>
            <li>Para proteger nuestros derechos, propiedad o seguridad, o los de otros.</li>
          </ul>
          
          <h2 className="text-xl font-semibold text-card-foreground">4. Seguridad de tu Información</h2>
          <p>
            Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger tu información personal. Si bien hemos tomado medidas razonables para asegurar la información personal que nos proporcionas, ten en cuenta que ninguna medida de seguridad es perfecta o impenetrable, y ningún método de transmisión de datos puede garantizarse contra cualquier interceptación u otro tipo de mal uso.
          </p>
          
          <h2 className="text-xl font-semibold text-card-foreground">5. Tus Derechos de Protección de Datos</h2>
          <p>
            Dependiendo de tu ubicación, puedes tener ciertos derechos con respecto a tu información personal, como el derecho a acceder, corregir, eliminar o restringir el procesamiento de tus datos.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">6. Cambios a esta Política de Privacidad</h2>
          <p>
            Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última actualización".
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">7. Contacto</h2>
          <p>
            Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad, por favor contáctanos a [email de contacto o formulario].
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
