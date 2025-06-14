
// src/app/admin/stats/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsersCountAction } from "@/actions/userActions";
import { getPropertiesCountAction } from "@/actions/propertyActions";
import { getRequestsCountAction } from "@/actions/requestActions";
import { getTotalPropertyViewsAction, getTotalPropertyInquiriesAction } from "@/actions/leadTrackingActions";
import { Users, Home, FileSearch, Eye, MessageCircleQuestion, BarChart3, Activity } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  colorClass?: string;
}

const StatCard = ({ title, value, icon, description, colorClass = "text-primary" }: StatCardProps) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-5 w-5 ${colorClass}`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default async function AdminStatsPage() {
  const totalUsers = await getUsersCountAction();
  const totalProperties = await getPropertiesCountAction(false);
  const activeProperties = await getPropertiesCountAction(true);
  const totalRequests = await getRequestsCountAction(false);
  const activeRequests = await getRequestsCountAction(true);
  const totalPropertyViews = await getTotalPropertyViewsAction();
  const totalPropertyInquiries = await getTotalPropertyInquiriesAction();

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border bg-gradient-to-br from-card to-background rounded-xl">
        <CardHeader className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="mb-4 sm:mb-0 p-3 bg-primary/10 rounded-lg inline-block self-start sm:self-center">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl lg:text-4xl font-headline">
                Estadísticas de la Plataforma
              </CardTitle>
              <CardDescription className="text-base lg:text-lg text-muted-foreground mt-1.5">
                Un resumen general de la actividad y contenido en konecte.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Usuarios Totales"
          value={totalUsers}
          icon={<Users />}
          colorClass="text-blue-500"
        />
        <StatCard
          title="Propiedades Totales"
          value={totalProperties}
          icon={<Home />}
          description={`${activeProperties} activas`}
          colorClass="text-green-500"
        />
        <StatCard
          title="Solicitudes Totales"
          value={totalRequests}
          icon={<FileSearch />}
          description={`${activeRequests} activas`}
          colorClass="text-yellow-500"
        />
         <StatCard
          title="Vistas de Propiedades"
          value={totalPropertyViews}
          icon={<Eye />}
          description="Total de veces que se han visto los detalles de propiedades."
          colorClass="text-purple-500"
        />
        <StatCard
          title="Consultas sobre Propiedades"
          value={totalPropertyInquiries}
          icon={<MessageCircleQuestion />}
          description="Total de formularios de contacto enviados."
          colorClass="text-teal-500"
        />
        <StatCard
          title="Actividad General (Próximamente)"
          value={"N/A"}
          icon={<Activity />}
          description="Más métricas detalladas estarán disponibles pronto."
          colorClass="text-gray-500"
        />
      </div>
       <Card className="mt-8 bg-secondary/20 border-dashed rounded-xl">
        <CardHeader>
            <CardTitle className="text-xl font-headline">Más Estadísticas Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Estamos trabajando para añadir más estadísticas detalladas, como actividad por rangos de fecha, propiedades más vistas, y más. ¡Vuelve pronto!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
