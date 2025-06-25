import { Metadata } from 'next';
import BugReportForm from '@/components/forms/BugReportForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BugIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reportar Fallas | Konecte',
  description: 'Reporta problemas o errores que encuentres en la plataforma para ayudarnos a mejorar.',
};

export default function ReportarFallasPage() {
  return (
    <div className="container max-w-4xl py-10 px-4 md:py-16">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <BugIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Reportar Fallas</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          ¿Encontraste algún problema en nuestra plataforma? Tu feedback es muy valioso para nosotros.
          Completa el formulario a continuación para reportar cualquier error o comportamiento inesperado.
        </p>
      </div>

      <Card className="border shadow-md">
        <CardHeader>
          <CardTitle>Formulario de Reporte</CardTitle>
          <CardDescription>
            Proporciona la mayor cantidad de detalles posibles para ayudarnos a identificar y solucionar el problema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BugReportForm />
        </CardContent>
      </Card>
    </div>
  );
} 