
// src/app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Users, LayoutDashboard, ShieldAlert, CreditCard, ListOrdered, FileSearch, Home, ArrowRight, Activity, Palette, ShieldCheck, DollarSign, BarChart3, Newspaper, MailQuestion, CalendarClock, MailWarning, MessageSquare, Bot } from "lucide-react";
import type { ReactNode } from 'react';
import { getUnreadContactSubmissionsCountAction } from "@/actions/contactFormActions";

interface AdminDashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  cta: string;
  colorClass?: string; 
  badgeContent?: string | number | null;
}

const AdminDashboardCard = ({ title, description, href, icon, cta, colorClass, badgeContent }: AdminDashboardCardProps) => (
  <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border flex flex-col group h-full bg-background hover:border-primary/50 relative">
    {badgeContent && (
        <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
            {badgeContent}
        </div>
    )}
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


export default async function AdminDashboardPage() {
  const unreadContactMessages = await getUnreadContactSubmissionsCountAction();

  const adminDashboardCardsConfig: AdminDashboardCardProps[] = [
   {
    title: "Estadísticas",
    description: "Visualiza métricas clave del rendimiento de la plataforma.",
    href: "/admin/stats", 
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    cta: "Ver Estadísticas",
    colorClass: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Apariencia del Sitio",
    description: "Personaliza el título, logo y secciones de la landing page global.",
    href: "/admin/appearance",
    icon: <Palette className="h-8 w-8 text-primary" />,
    cta: "Configurar Apariencia",
    colorClass: "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Contenido del Sitio",
    description: "Edita los textos clave utilizados en diversas partes del sitio web.",
    href: "/admin/content",
    icon: <Newspaper className="h-8 w-8 text-primary" />,
    cta: "Gestionar Contenido",
    colorClass: "from-pink-500/10 to-pink-500/5 text-pink-600 dark:text-pink-400",
  },
  {
    title: "Mensajes de Contacto",
    description: "Revisa y gestiona los mensajes enviados desde el formulario de contacto público.",
    href: "/admin/contact-submissions",
    icon: <MailWarning className="h-8 w-8 text-primary" />,
    cta: "Ver Mensajes",
    colorClass: "from-orange-500/10 to-orange-500/5 text-orange-600 dark:text-orange-400",
    badgeContent: unreadContactMessages > 0 ? unreadContactMessages : null,
  },
  {
    title: "Visor Chat WhatsApp", 
    description: "Visualiza las conversaciones del bot de WhatsApp con los usuarios.",
    href: "/admin/whatsapp-viewer",
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    cta: "Ver Chats WhatsApp",
    colorClass: "from-sky-500/10 to-sky-500/5 text-sky-600 dark:text-sky-400",
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
    title: "Gestión de Visitas", 
    description: "Supervisa todas las solicitudes de visita y su estado en la plataforma.",
    href: "/admin/visits",
    icon: <CalendarClock className="h-8 w-8 text-primary" />,
    cta: "Ver Visitas",
    colorClass: "from-cyan-500/10 to-cyan-500/5 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Página de Contacto (Pública)", 
    description: "Accede a la página pública de contacto. Los mensajes llegan a 'Mensajes de Contacto'.",
    href: "/contact", 
    icon: <MailQuestion className="h-8 w-8 text-primary" />,
    cta: "Ir a Contacto",
    colorClass: "from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400",
  },
  {
    title: "Análisis WhatsBot", // Renamed
    description: "Configura la fuente de datos para el análisis del WhatsBot.", // Updated description
    href: "/admin/settings",
    icon: <Bot className="h-8 w-8 text-primary" />, // Updated icon
    cta: "Configurar Análisis", // Updated CTA
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
];

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
                    Bienvenido al centro de control de konecte. Gestiona contenido y configuraciones.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminDashboardCardsConfig.sort((a,b) => a.title.localeCompare(b.title)).map((item) => ( // Ordenar alfabéticamente
          <AdminDashboardCard
            key={item.title}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            cta={item.cta}
            colorClass={item.colorClass}
            badgeContent={item.badgeContent}
          />
        ))}
      </div>
    </div>
  );
}

