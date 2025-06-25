import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/session';
import BugReportsList from '@/components/admin/BugReportsList';

export const metadata: Metadata = {
  title: 'Administrar Reportes de Errores | Panel Admin',
  description: 'Gestiona los reportes de errores enviados por los usuarios.',
};

export default async function AdminBugReportsPage() {
  const isUserAdmin = await isAdmin();
  
  // Verificar si el usuario es administrador
  if (!isUserAdmin) {
    redirect('/auth/signin?callbackUrl=/admin/bug-reports');
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Errores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y responde a los reportes de errores enviados por los usuarios.
        </p>
      </div>
      
      <BugReportsList />
    </div>
  );
} 