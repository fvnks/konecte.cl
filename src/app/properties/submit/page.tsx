import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PropertyForm from "@/components/property/PropertyForm";

export default function SubmitPropertyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Publica Tu Propiedad</CardTitle>
          <CardDescription className="text-center text-lg">
            Completa los detalles a continuación para listar tu propiedad en venta o arriendo en PropSpot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <PropertyForm />
        </CardContent>
      </Card>
    </div>
  );
}
