
// src/app/plans/page.tsx
import { getPlansAction } from '@/actions/planActions';
import type { Plan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, XCircle } from 'lucide-react';
import PlanDisplayCard from '@/components/plan/PlanDisplayCard';
import Link from 'next/link';

export default async function PlansPage() {
  const allPlans = await getPlansAction();
  const activePlans = allPlans.filter(plan => plan.is_active);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl text-primary">
          Nuestros Planes
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Elige el plan que mejor se adapte a tus necesidades para publicar y gestionar tus propiedades y solicitudes.
        </p>
      </section>

      {activePlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
          {activePlans.map((plan) => (
            <PlanDisplayCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg shadow-md">
          <CreditCard className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">No hay planes disponibles actualmente.</h2>
          <p className="text-muted-foreground mb-8">
            Por favor, vuelve a consultar más tarde o contacta con nosotros para más información.
          </p>
          <Button asChild>
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      )}

      <section className="mt-16 py-10 bg-secondary/50 rounded-xl shadow-sm text-center">
        <h2 className="text-2xl font-headline font-semibold mb-4 text-foreground">¿Tienes Preguntas?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Nuestro equipo está listo para ayudarte a elegir el mejor plan o responder cualquier consulta que tengas.
        </p>
        <Button size="lg" variant="default">Contactar Soporte</Button>
      </section>
    </div>
  );
}
    