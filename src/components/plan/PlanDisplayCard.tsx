
// src/components/plan/PlanDisplayCard.tsx
import type { Plan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ThumbsUp, Clock, Infinite, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanDisplayCardProps {
  plan: Plan;
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0 }).format(price);
  } catch {
    return `${price.toLocaleString('es-CL')} ${currency}`;
  }
}

export default function PlanDisplayCard({ plan }: PlanDisplayCardProps) {
  const isFreePlan = plan.price_monthly === 0;

  return (
    <Card className={cn(
      "flex flex-col shadow-xl rounded-xl border-2 hover:shadow-2xl transition-all duration-300",
      isFreePlan ? "border-muted-foreground/30 bg-card" : "border-primary bg-gradient-to-br from-primary/5 via-card to-card"
    )}>
      <CardHeader className="p-6 text-center">
        <CardTitle className={cn(
          "text-2xl font-headline font-bold",
          isFreePlan ? "text-foreground" : "text-primary"
        )}>
          {plan.name}
        </CardTitle>
        {plan.description && (
          <CardDescription className="text-sm text-muted-foreground mt-1 min-h-[40px] line-clamp-2">
            {plan.description}
          </CardDescription>
        )}
        <div className={cn(
            "text-4xl font-extrabold mt-4",
            isFreePlan ? "text-foreground" : "text-accent"
          )}>
          {isFreePlan ? 'Gratis' : formatPrice(plan.price_monthly, plan.price_currency)}
          {!isFreePlan && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-3 flex-grow">
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            Propiedades permitidas: <span className="font-semibold text-foreground ml-1">{plan.max_properties_allowed ?? <Infinite className="inline h-4 w-4"/>}{plan.max_properties_allowed === null ? ' Ilimitadas' : ''}</span>
          </li>
          <li className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            Solicitudes permitidas: <span className="font-semibold text-foreground ml-1">{plan.max_requests_allowed ?? <Infinite className="inline h-4 w-4"/>}{plan.max_requests_allowed === null ? ' Ilimitadas' : ''}</span>
          </li>
          <li className="flex items-center">
            {plan.can_feature_properties ? <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" /> : <XCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />}
            Destacar propiedades: <span className="font-semibold text-foreground ml-1">{plan.can_feature_properties ? 'Sí' : 'No'}</span>
          </li>
          <li className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            Duración publicación: 
            <span className="font-semibold text-foreground ml-1">
              {plan.property_listing_duration_days ? `${plan.property_listing_duration_days} días` : <><Infinite className="inline h-4 w-4"/> Indefinida</>}
            </span>
          </li>
        </ul>
         {/* Puedes añadir más detalles del plan aquí si es necesario */}
      </CardContent>
      <CardFooter className="p-6 mt-auto">
        <Button 
          className="w-full text-base py-3 h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
          variant={isFreePlan ? "outline" : "default"}
        >
          {isFreePlan ? 'Comenzar Gratis' : 'Elegir Plan'} <ThumbsUp className="ml-2 h-4 w-4"/>
        </Button>
      </CardFooter>
    </Card>
  );
}
    