import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Panel de Administración</CardTitle>
          <CardDescription>Bienvenido al panel de administración de PropSpot. Aquí puedes gestionar la configuración de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Utiliza el menú de la izquierda para navegar por las diferentes secciones de administración.</p>
          <Button asChild>
            <Link href="/admin/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Ir a Configuración de Google Sheets
            </Link>
          </Button>
        </CardContent>
      </Card>
       {/* Aquí podrías añadir más tarjetas o widgets para el dashboard */}
    </div>
  );
}
