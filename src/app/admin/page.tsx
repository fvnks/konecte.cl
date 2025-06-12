
// src/app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Users, LayoutDashboard, Brush, CreditCard, ListOrdered, FileSearch, Home, ArrowRight, Activity, Palette, ShieldCheck, DollarSign, BarChart3 } from "lucide-react";
import type { ReactNode } from 'react';

interface AdminDashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  cta: string;
  colorClass?: string; // Para un toque de color en el icono
}

const AdminDashboardCard = ({ title, description, href, icon, cta, colorClass }: AdminDashboardCardProps) => (
  <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border flex flex-col group h-full bg-background hover:border-primary/50">
    <CardHeader className="pb-4">
      <div className={`mb-4 p-3 rounded-lg inline-block bg-gradient-to-br ${colorClass || 'from-primary/10 to-primary/5'} transition-all duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <CardTitle className="text-xl font-headline text-foreground">{title}</CardTitle>
      <CardDescription className="text-sm h-12 line-clamp-2 text-muted-foreground">{description}</CardDescription>
    </CardHeader>
    <CardFooter className="pt-0 mt-auto">
      <Button asChild variant="outline" size="sm" className="w-full rounded-md text-primary border-primary/30 hover:bg-primary/10 hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Link href={href} className="flex items-center justify-center">
          {cta} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

const adminDashboardCardsConfig: AdminDashboardCardProps[] = [
  {
    title: "Apariencia del Sitio",
    description: "Personaliza el título, logo y secciones de la landing page global.",
    href: "/admin/appearance",
    icon: <Palette className="h-8 w-8 text-primary" />,
    cta: "Configurar Apariencia",
    colorClass: "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Gestión de Usuarios",
    description: "Administra usuarios, asigna roles y gestiona sus planes de suscripción.",
    href: "/admin/users",
    icon: <Users className="h-8 w-8 text-primary" />,
    cta: "Gestionar Usuarios",
    colorClass: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Gestión de Propiedades",
    description: "Modera, edita y administra todos los listados de propiedades activas e inactivas.",
    href: "/admin/properties",
    icon: <ListOrdered className="h-8 w-8 text-primary" />,
    cta: "Ver Propiedades",
    colorClass: "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400",
  },
  {
    title: "Gestión de Solicitudes",
    description: "Revisa, modera y administra las solicitudes de búsqueda de los usuarios.",
    href: "/admin/requests",
    icon: <FileSearch className="h-8 w-8 text-primary" />,
    cta: "Ver Solicitudes",
    colorClass: "from-yellow-500/10 to-yellow-500/5 text-yellow-600 dark:text-yellow-400",
  },
  {
    title: "Config. Google Sheets",
    description: "Conecta y configura la integración con Google Sheets para mostrar datos.",
    href: "/admin/settings",
    icon: <Settings className="h-8 w-8 text-primary" />,
    cta: "Ir a Configuración",
    colorClass: "from-gray-500/10 to-gray-500/5 text-gray-600 dark:text-gray-400",
  },
  {
    title: "Gestión de Roles",
    description: "Define y administra los roles de usuario y sus permisos (conceptual).",
    href: "/admin/roles",
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    cta: "Administrar Roles",
    colorClass: "from-red-500/10 to-red-500/5 text-red-600 dark:text-red-400",
  },
   {
    title: "Gestión de Planes",
    description: "Crea y administra los planes de suscripción/uso para los usuarios.",
    href: "/admin/plans",
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    cta: "Administrar Planes",
    colorClass: "from-teal-500/10 to-teal-500/5 text-teal-600 dark:text-teal-400",
  },
  //  Placeholder para futuras estadísticas
   {
    title: "Estadísticas (Próx.)",
    description: "Visualiza métricas clave del rendimiento de la plataforma.",
    href: "/admin", // Enlace a la misma página por ahora
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    cta: "Ver Estadísticas",
    colorClass: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400",
  },
];


export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border bg-gradient-to-br from-card to-background rounded-xl">
        <CardHeader className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="mb-4 sm:mb-0 p-3 bg-primary/10 rounded-lg inline-block self-start sm:self-center">
                <LayoutDashboard className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <div>
                <CardTitle className="text-3xl lg:text-4xl font-headline">
                    Panel de Administración
                </CardTitle>
                <CardDescription className="text-base lg:text-lg text-muted-foreground mt-1.5">
                    Bienvenido al centro de control de PropSpot. Gestiona contenido y configuraciones.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        {/* <CardContent className="p-6 sm:p-8 pt-0">
            <p className="text-muted-foreground">
                Utiliza el menú de navegación o los accesos directos a continuación para administrar.
            </p>
        </CardContent> */}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminDashboardCardsConfig.map((item) => (
          <AdminDashboardCard
            key={item.title}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            cta={item.cta}
            colorClass={item.colorClass}
          />
        ))}
      </div>
      
      {/* <Card className="mt-8 bg-secondary/20 border-dashed rounded-xl">
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
      </Card> */}

    </div>
  );
}
