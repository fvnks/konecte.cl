import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This will be replaced by a form component later
// import PropertyForm from "@/components/property/PropertyForm";

export default function SubmitPropertyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Publica Tu Propiedad</CardTitle>
          <CardDescription>Completa los detalles a continuación para publicar tu propiedad en venta o alquiler.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <PropertyForm /> */}
          <div className="text-center p-8 border border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">¡Formulario de Propiedad Próximamente!</h3>
            <p className="text-muted-foreground mb-4">
              El formulario para enviar listados de propiedades estará disponible aquí.
            </p>
            <Button variant="outline" asChild>
              <Link href="/properties">Volver a Propiedades</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
