import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This will be replaced by a form component later
// import RequestForm from "@/components/request/RequestForm";

export default function SubmitRequestPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Publica Tu Solicitud de Propiedad</CardTitle>
          <CardDescription>Haz saber a otros qué tipo de propiedad estás buscando.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <RequestForm /> */}
           <div className="text-center p-8 border border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">¡Formulario de Solicitud Próximamente!</h3>
            <p className="text-muted-foreground mb-4">
              El formulario para publicar solicitudes de búsqueda de propiedades estará disponible aquí.
            </p>
            <Button variant="outline" asChild>
              <Link href="/requests">Volver a Solicitudes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
