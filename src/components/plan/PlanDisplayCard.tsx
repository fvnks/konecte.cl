
// src/components/plan/PlanDisplayCard.tsx
import type { Plan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanDisplayCardProps {
  plan: Plan;
}

function formatPrice(price: number, currency: string) {
  if (currency?.toUpperCase() === 'UF') {
    return `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}`;
  }
  try { // Para CLP u otras monedas
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch { // Fallback si la moneda no es reconocida por Intl
    return `${price.toLocaleString('es-CL')} ${currency}`;
  }
}

// Simulación de usuarios por corredora según el nombre del plan (esto debería venir de la BD idealmente)
function getUsersForPlan(planName: string): string {
    const nameLower = planName.toLowerCase();
    if (nameLower.includes("inicia")) return "1 usuario";
    if (nameLower.includes("crece")) return "3 usuarios";
    if (nameLower.includes("avanza")) return "5 usuarios";
    if (nameLower.includes("premium")) return "Usuarios Ilimitados";
    return "Múltiples usuarios"; // Fallback
}

export default function PlanDisplayCard({ plan }: PlanDisplayCardProps) {
  const isFreePlan = plan.price_monthly === 0;
  const formattedPrice = isFreePlan ? 'Gratis' : formatPrice(plan.price_monthly, plan.price_currency);
  const priceSuffix = plan.price_currency?.toUpperCase() === 'UF' ? ' UF' : '';
  const usersByBrokerage = getUsersForPlan(plan.name);

  return (
    <Card className="shadow-lg rounded-xl border bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Sección Izquierda: Información del Plan */}
        <div className="flex-grow">
          <CardTitle className="text-2xl font-bold text-purple-600 mb-1.5">
            {plan.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Publica hasta {plan.max_properties_allowed ?? 'ilimitadas'} propiedades
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            <Users className="h-4 w-4 mr-1.5 text-purple-600/70"/> {usersByBrokerage} por corredora
          </p>
          {plan.description && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{plan.description}</p>}
        </div>

        {/* Sección Derecha: Precio y Botón */}
        <div className="flex-shrink-0 text-left sm:text-right mt-3 sm:mt-0">
          <div className="text-2xl font-bold text-foreground mb-0.5">
            {formattedPrice}
            {!isFreePlan && <span className="font-normal">{priceSuffix}</span>}
          </div>
          {!isFreePlan && (
            <p className="text-xs text-muted-foreground -mt-1 mb-2.5">
              + IVA mensual
            </p>
          )}
          <Button 
            variant="outline" 
            className={cn(
              "border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-600/10 dark:hover:text-purple-500 w-full sm:w-auto rounded-md text-sm py-2 px-4 h-auto",
              isFreePlan && "border-primary text-primary hover:bg-primary/10"
            )}
          >
            {isFreePlan ? 'Comenzar Ahora' : 'Contratar'}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
