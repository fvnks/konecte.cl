
import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, LayoutDashboard, ShieldAlert, CreditCard, ListOrdered, Brush, FileSearch, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Asumiendo que tienes un logo o avatar para el admin

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/appearance', label: 'Apariencia', icon: <Brush className="h-5 w-5" /> },
  { href: '/admin/settings', label: 'Google Sheets', icon: <Settings className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Usuarios', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/roles', label: 'Roles', icon: <ShieldAlert className="h-5 w-5" /> },
  { href: '/admin/plans', label: 'Planes', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/admin/properties', label: 'Propiedades', icon: <ListOrdered className="h-5 w-5" /> },
  { href: '/admin/requests', label: 'Solicitudes', icon: <FileSearch className="h-5 w-5" /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Simulación de datos del admin - en una app real vendría de la sesión
  const adminUser = { name: 'Admin PropSpot', avatarUrl: `https://placehold.co/40x40.png?text=A` };

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-72 bg-background border-r p-5 space-y-6 hidden md:flex flex-col shadow-md">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link href="/" className="flex items-center gap-3 text-primary group">
            {/* Puedes reemplazar esto con tu logo si tienes uno para el admin panel */}
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Home className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xl font-bold font-headline text-foreground group-hover:text-primary transition-colors">PropSpot Admin</span>
          </Link>
        </div>
        
        <Separator />

        <nav className="flex-grow space-y-1.5">
          {adminNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className="w-full justify-start text-base py-2.5 h-auto rounded-md hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
            >
              <Link href={item.href} className="flex items-center gap-3 px-3">
                {React.cloneElement(item.icon, { className: "h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" })}
                <span className="font-medium">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        
        <Separator />
        
        <div className="mt-auto space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border">
                <Avatar className="h-10 w-10">
                <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} data-ai-hint="admin avatar"/>
                <AvatarFallback className="bg-primary text-primary-foreground">{adminUser.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <div>
                <p className="text-sm font-semibold text-foreground">{adminUser.name}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
            </div>
          <Button variant="outline" asChild className="w-full text-base py-2.5 h-auto rounded-md border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
            <Link href="/" className="flex items-center gap-2">
                <LogOut className="h-4 w-4 transform rotate-180"/> Volver al Sitio
            </Link>
          </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        {/* Opcional: un header simple para móvil y como barra superior en desktop si se desea */}
        <header className="bg-background border-b p-4 shadow-sm md:hidden">
            <div className="flex items-center justify-between">
                 <Link href="/admin" className="flex items-center gap-2 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-lg font-bold font-headline">Admin</span>
                </Link>
                {/* Aquí podría ir un SheetTrigger para el menú móvil */}
            </div>
        </header>
        <main className="flex-grow p-6 sm:p-8 md:p-10 bg-muted/30"> {/* Fondo ligeramente distinto para el contenido */}
          {children}
        </main>
      </div>
    </div>
  );
}
    
