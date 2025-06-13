
// src/app/plans/page.tsx
import { getPlansAction } from '@/actions/planActions';
import type { Plan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, ChevronRight } from 'lucide-react';
import PlanDisplayCard from '@/components/plan/PlanDisplayCard';
import Link from 'next/link';

const whyPropSpotBenefits = [
  "Tu propiedad en los principales portales.",
  "Expertos inmobiliarios a tu disposición.",
  "Asesoría legal y financiera.",
  "Fotografía profesional y tours virtuales.",
  "Publicación destacada en redes sociales.",
];

const withEveryPlanBenefits = [
  "Publicación en PropSpot.cl",
  "Estadísticas de rendimiento",
  "Soporte técnico especializado",
  "Acceso a base de datos de clientes",
  "Integración con CRM Inmobiliario.",
];

export default async function PlansPage() {
  const allPlans = await getPlansAction();
  const activePlans = allPlans.filter(plan => plan.is_active);

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold tracking-tight text-purple-600">
          ¡Contratación 100% online!
        </h1>
        {/* <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Elige el plan que mejor se adapte a tus necesidades para publicar y gestionar tus propiedades y solicitudes.
        </p> */}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 items-start">
        {/* Columna Izquierda - Información */}
        <div className="md:col-span-3 space-y-6">
          <Card className="shadow-xl rounded-xl border bg-card">
            <CardHeader className="p-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">¿Por qué contratar en PropSpot?</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-3 text-muted-foreground">
                {whyPropSpotBenefits.map((benefit, index) => (
                  <li key={`why-${index}`} className="flex items-start">
                    <Check className="h-5 w-5 mr-2.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-xl border bg-card">
            <CardHeader className="p-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">Con cada plan obtendrás:</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-3 text-muted-foreground">
                {withEveryPlanBenefits.map((benefit, index) => (
                  <li key={`every-${index}`} className="flex items-start">
                    <Check className="h-5 w-5 mr-2.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="shadow-xl rounded-xl border bg-card p-6 space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">¿Tienes dudas?</h3>
                <p className="text-sm text-muted-foreground">
                Revisa nuestras <Link href="/faq" className="text-purple-600 hover:underline font-medium">preguntas frecuentes</Link> o <Link href="/contact" className="text-purple-600 hover:underline font-medium">contáctanos</Link>.
                </p>
            </div>
             <div className="pt-3 border-t">
                <h3 className="text-lg font-semibold text-foreground mb-2">Nuestros medios de pago:</h3>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                    <p className="text-sm text-teal-800 dark:text-teal-200">Aceptamos: VISA, Mastercard, American Express, Transferencia Bancaria.</p>
                    {/* En el futuro, podrías agregar logos aquí si los tienes */}
                </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha - Planes */}
        <div className="md:col-span-2 space-y-6">
          {activePlans.length > 0 ? (
            activePlans.map((plan) => (
              <PlanDisplayCard key={plan.id} plan={plan} />
            ))
          ) : (
            <Card className="shadow-lg rounded-xl border bg-card text-center py-12">
              <CreditCard className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <CardTitle className="text-xl font-semibold text-foreground mb-3">No hay planes disponibles.</CardTitle>
              <CardDescription className="text-muted-foreground mb-6">
                Vuelve a consultar más tarde.
              </CardDescription>
              <Button asChild>
                <Link href="/">Volver al Inicio</Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
