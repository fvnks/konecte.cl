import type { ReactNode } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, LayoutDashboard, ShieldAlert, CreditCard, ListOrdered, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/appearance', label: 'Apariencia del Sitio', icon: <Brush className="h-5 w-5" /> },
  { href: '/admin/settings', label: 'Configuración Google Sheets', icon: <Settings className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Gestión de Usuarios', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/roles', label: 'Gestión de Roles', icon: <ShieldAlert className="h-5 w-5" /> },
  { href: '/admin/plans', label: 'Gestión de Planes', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/properties', label: 'Gestión de Propiedades', icon: <ListOrdered className="h-5 w-5" /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r p-4 space-y-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 px-2 py-2">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Home className="h-6 w-6" />
            <span className="text-lg font-bold font-headline">PropSpot Admin</span>
          </Link>
        </div>
        <Separator />
        <nav className="flex-grow">
          <ul className="space-y-2">
            {adminNavItems.map((item) => (
              <li key={item.label}>
                <Button variant="ghost" asChild className="w-full justify-start text-base">
                  <Link href={item.href} className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <Separator />
        <div>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Volver al Sitio Principal</Link>
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 md:hidden">
            {/* Header para móvil si es necesario, o simplemente un título */}
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </header>
        <main className="flex-grow p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
