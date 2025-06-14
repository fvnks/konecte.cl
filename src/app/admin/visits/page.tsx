
// src/app/admin/visits/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarClock, Construction } from "lucide-react";

export default function AdminVisitsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl border">
        <CardHeader className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl md:text-3xl font-headline">
                Gestión de Visitas a Propiedades
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                Administra y supervisa todas las visitas programadas en la plataforma.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-center">
          <Construction className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sección en Construcción</h2>
          <p className="text-muted-foreground mb-6">
            La funcionalidad completa para la gestión de visitas por parte de los administradores
            estará disponible próximamente.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin">Volver al Dashboard de Admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
