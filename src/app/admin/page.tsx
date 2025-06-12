
// src/app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Users, LayoutDashboard, Brush, CreditCard, ListOrdered, FileSearch, Home } from "lucide-react";

const adminDashboardCards = [
  {
    title: "Apariencia del Sitio",
    description: "Personaliza el título, logo y secciones de la landing page.",
    href: "/admin/appearance",
    icon: <Brush className="h-8 w-8 text-primary" />,
    cta: "Configurar Apariencia",
  },
  {
    title: "Gestión de Usuarios",
    description: "Administra usuarios, roles y planes.",
    href: "/admin/users",
    icon: <Users className="h-8 w-8 text-primary" />,
    cta: "Gestionar Usuarios",
  },
  {
    title: "Gestión de Propiedades",
    description: "Modera y gestiona los listados de propiedades.",
    href: "/admin/properties",
    icon: <ListOrdered className="h-8 w-8 text-primary" />,
    cta: "Ver Propiedades",
  },
  {
    title: "Gestión de Solicitudes",
    description: "Modera y gestiona las solicitudes de búsqueda.",
    href: "/admin/requests",
    icon: <FileSearch className="h-8 w-8 text-primary" />,
    cta: "Ver Solicitudes",
  },
  {
    title: "Config. Google Sheets",
    description: "Conecta y configura la integración con Google Sheets.",
    href: "/admin/settings",
    icon: <Settings className="h-8 w-8 text-primary" />,
    cta: "Ir a Configuración",
  },
  {
    title: "Gestión de Roles",
    description: "Define y administra los roles de usuario.",
    href: "/admin/roles",
    icon: <Users className="h-8 w-8 text-primary" />, // Re-usamos Users por ahora, podría ser Shield
    cta: "Administrar Roles",
  },
   {
    title: "Gestión de Planes",
    description: "Crea y administra los planes de suscripción.",
    href: "/admin/plans",
    icon: <CreditCard className="h-8 w-8 text-primary" />,
    cta: "Administrar Planes",
  },
];


export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border bg-gradient-to-br from-card to-secondary/30">
        <CardHeader className="p-6">
          <CardTitle className="text-3xl font-headline flex items-center">
            <LayoutDashboard className="h-8 w-8 mr-3 text-primary" />
            Panel de Administración PropSpot
          </CardTitle>
          <CardDescription className="text-base mt-1">
            Bienvenido al centro de control. Desde aquí puedes gestionar todos los aspectos de la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
            <p className="text-muted-foreground">
                Utiliza el menú de navegación a tu izquierda o los accesos directos a continuación para administrar el contenido y la configuración.
            </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminDashboardCards.map((item) => (
          <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow rounded-xl border flex flex-col">
            <CardHeader className="pb-4">
              <div className="mb-3 text-primary">{item.icon}</div>
              <CardTitle className="text-xl font-headline">{item.title}</CardTitle>
              <CardDescription className="text-sm h-10 line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0 mt-auto">
              <Button asChild variant="default" size="sm" className="w-full rounded-md">
                <Link href={item.href}>{item.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8 bg-secondary/20 border-dashed">
        <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
                <Home className="h-5 w-5 mr-2 text-primary" />
                Volver al Sitio Principal
            </CardTitle>
            <CardDescription>Navega de vuelta a la vista pública de PropSpot.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild variant="outline">
                <Link href="/">Ir a la Página de Inicio</Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
