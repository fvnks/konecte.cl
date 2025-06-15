
// src/app/plans/page.tsx
import { getPlansAction } from '@/actions/planActions';
import { getEditableTextAction } from '@/actions/editableTextActions'; 
import type { Plan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, CreditCard } from 'lucide-react';
import PlanDisplayCard from '@/components/plan/PlanDisplayCard';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const whyKonecteBenefits = [
  "Tu propiedad en los principales portales.",
  "Expertos inmobiliarios a tu disposición.",
  "Asesoría legal y financiera.",
  "Fotografía profesional y tours virtuales.",
  "Publicación destacada en redes sociales.",
];

const withEveryPlanBenefits = [
  "Publicación en konecte", 
  "Estadísticas de rendimiento",
  "Soporte técnico especializado",
  "Acceso a base de datos de clientes",
  "Integración con CRM Inmobiliario.",
];

const DEFAULT_PLANS_TITLE = "¡Contratación 100% online!";

export default async function PlansPage() {
  // getPlansAction ahora devuelve solo planes activos Y públicamente visibles por defecto.
  const publiclyVisibleActivePlans = await getPlansAction(); 
  const pageTitle = await getEditableTextAction('plans_page_main_title') || DEFAULT_PLANS_TITLE;

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold tracking-tight text-purple-600">
          {pageTitle}
        </h1>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 items-start">
        {/* Columna Izquierda - Información Consolidada */}
        <div className="md:col-span-3">
          <Card className="shadow-xl rounded-xl border bg-card">
            <CardHeader className="p-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">¿Por qué contratar en konecte?</CardTitle> 
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-3 text-muted-foreground">
                {whyKonecteBenefits.map((benefit, index) => (
                  <li key={`why-${index}`} className="flex items-start">
                    <Check className="h-5 w-5 mr-2.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <Separator className="my-4 mx-6" />

            <CardHeader className="p-6 pt-2">
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
            
            <Separator className="my-4 mx-6" />

            <CardContent className="p-6 pt-2 space-y-3">
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1.5">¿Tienes dudas?</h3>
                    <p className="text-sm text-muted-foreground">
                    Revisa nuestras <Link href="/faq" className="text-purple-600 hover:underline font-medium">preguntas frecuentes</Link> o <Link href="/contact" className="text-purple-600 hover:underline font-medium">contáctanos</Link>.
                    </p>
                </div>
            </CardContent>
            
            <Separator className="my-4 mx-6" />

            <CardContent className="p-6 pt-2">
                <h3 className="text-lg font-semibold text-foreground mb-2">Nuestros medios de pago:</h3>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                    <p className="text-sm text-teal-800 dark:text-teal-200">Aceptamos: VISA, Mastercard, American Express, Transferencia Bancaria.</p>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Planes */}
        <div className="md:col-span-2 space-y-6">
          {publiclyVisibleActivePlans.length > 0 ? (
            publiclyVisibleActivePlans.map((plan) => (
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
