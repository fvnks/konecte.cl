// src/app/requests/submit/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RequestForm from "@/components/request/RequestForm"; // Importamos el nuevo formulario

export default function SubmitRequestPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Publica Tu Solicitud de Propiedad</CardTitle>
          <CardDescription className="text-center text-lg">
            Completa los detalles a continuación para que otros sepan qué tipo de propiedad estás buscando.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <RequestForm />
        </CardContent>
      </Card>
    </div>
  );
}

    