// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListTree, SearchCheck, Building, UserCircle, Loader2, CreditCard, Users as UsersIcon, LayoutGrid, ArrowRight, Eye, MessageSquare, Briefcase, Sparkles } from 'lucide-react';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem';
import type { PropertyListing, SearchRequest, User as StoredUserType } from '@/lib/types';
import { useEffect, useState, ReactNode } from 'react';
import { getUserPropertiesAction } from '@/actions/propertyActions';
import { getUserRequestsAction } from '@/actions/requestActions';
import { getUserTotalPropertyViewsAction, getUserTotalPropertyInquiriesAction } from '@/actions/leadTrackingActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StyledLogoutButton from '@/components/ui/StyledLogoutButton';
import AnimatedLetterButton from '@/components/ui/AnimatedLetterButton';

interface DashboardUser extends StoredUserType {
  planId?: string | null;
  planName?: string | null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  colorClass?: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, description, colorClass = "text-primary", isLoading }: StatCardProps) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl border flex flex-col">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`h-5 w-5 ${colorClass}`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      {isLoading ? (
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      ) : (
        <div className="text-3xl font-bold text-foreground">{value}</div>
      )}
      {description && !isLoading && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

interface DashboardActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  cta: string;
  colorClass?: string;
}

const DashboardActionCard = ({ title, description, href, icon, cta, colorClass }: DashboardActionCardProps) => (
  <Card className="shadow-md hover:shadow-lg transition-all duration-300 rounded-xl border flex flex-col group h-full bg-card hover:border-primary/50">
    <CardHeader className="pb-4">
      <div className={`mb-3 p-2.5 rounded-lg inline-block bg-gradient-to-br ${colorClass || 'from-primary/10 to-primary/5'}`}>
        {icon}
      </div>
      <CardTitle className="text-lg font-headline text-foreground">{title}</CardTitle>
      <CardDescription className="text-sm h-10 line-clamp-2 text-muted-foreground">{description}</CardDescription>
    </CardHeader>
    <CardFooter className="pt-0 mt-auto">
      <Button asChild variant="outline" className="w-full rounded-md text-primary border-primary/30 hover:bg-primary/10 hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors h-9 px-3 text-xs sm:text-sm">
        <Link href={href} className="flex items-center justify-center">
          {cta} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);


export default function DashboardPage() {
  const [loggedInUser, setLoggedInUser] = useState<DashboardUser | null>(null);
  
  const [userTotalProperties, setUserTotalProperties] = useState(0);
  const [userTotalRequests, setUserTotalRequests] = useState(0);
  const [userTotalPropertyViews, setUserTotalPropertyViews] = useState(0);
  const [userTotalPropertyInquiries, setUserTotalPropertyInquiries] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userJson = localStorage.getItem('loggedInUser');
    if (userJson) {
      try {
        const user: DashboardUser = JSON.parse(userJson);
        setLoggedInUser(user);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (loggedInUser?.id) {
        setIsLoading(true);
        setIsLoadingStats(true);
        try {
            const [properties, requests, views, inquiries] = await Promise.all([
              getUserPropertiesAction(loggedInUser.id),
              getUserRequestsAction(loggedInUser.id),
              getUserTotalPropertyViewsAction(loggedInUser.id),
              getUserTotalPropertyInquiriesAction(loggedInUser.id)
            ]);
            setUserTotalProperties(properties.length);
            setUserTotalRequests(requests.length);
            setUserTotalPropertyViews(views);
            setUserTotalPropertyInquiries(inquiries);
        } catch(error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingStats(false);
        }
      } else if (isClient && localStorage.getItem('loggedInUser') === null) {
        setIsLoading(false);
        setIsLoadingStats(false);
      }
    }
    if (isClient) {
        fetchData();
    }
  }, [loggedInUser, isClient]);

  const userName = loggedInUser?.name || "Usuario";
  const userAvatar = loggedInUser?.avatarUrl;
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  if (!isClient || (isLoading && !loggedInUser)) { // Adjusted loading condition
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem)-var(--footer-height,5rem))] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tu panel...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem)-var(--footer-height,5rem))] py-10">
        <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold mb-2">Debes iniciar sesión para ver tu panel.</p>
        <Button asChild>
          <Link href="/auth/signin">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="shadow-xl rounded-xl border overflow-hidden">
        <CardHeader className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-card shadow-md">
                <AvatarImage src={userAvatar} alt={userName} data-ai-hint="usuario perfil"/>
                <AvatarFallback className="text-2xl md:text-3xl bg-muted">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl md:text-4xl font-headline font-bold">¡Hola, {userName}!</CardTitle>
                <CardDescription className="text-base md:text-lg text-muted-foreground mt-1.5">Bienvenido a tu centro de control en konecte.</CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row-reverse items-center gap-4 self-start sm:self-center">
                {loggedInUser && (
                     <div className="text-sm bg-card p-4 rounded-lg shadow-sm border text-left min-w-[220px] w-full sm:w-auto">
                        <p className="font-semibold text-foreground mb-0.5">Tu Plan Actual:</p>
                        <p className="text-primary font-medium flex items-center gap-1.5 text-lg">
                            <CreditCard className="h-5 w-5 mt-0.5" />
                            {loggedInUser.planName || "Básico"}
                        </p>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs text-accent hover:text-accent/80" asChild>
                            <Link href="/profile">
                                {loggedInUser.planName ? "Gestionar Plan" : "Ver Planes"} <ArrowRight className="h-3 w-3 ml-1"/>
                            </Link>
                        </Button>
                    </div>
                )}
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <StyledLogoutButton onClick={() => {
                      localStorage.removeItem('loggedInUser');
                      window.dispatchEvent(new Event('userSessionChanged'));
                      // Idealmente, usar el router de Next para navegar
                      window.location.href = '/';
                    }} />
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardActionCard
            title="Publicar Propiedad"
            description="Añade una nueva propiedad al listado para que otros la encuentren."
            href="/properties/submit"
            icon={<PlusCircle className="h-7 w-7 text-primary" />}
            cta="Publicar Ahora"
            colorClass="from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400"
          />
          <DashboardActionCard
            title="Publicar Solicitud"
            description="Describe la propiedad que buscas para que los corredores te encuentren."
            href="/requests/submit"
            icon={<PlusCircle className="h-7 w-7 text-primary" />}
            cta="Crear Solicitud"
            colorClass="from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400"
          />
          <DashboardActionCard
            title="Coincidencias con IA"
            description="Revisa las coincidencias que la IA ha encontrado para tus publicaciones."
            href="/ai-matching"
            icon={<Sparkles className="h-7 w-7 text-primary" />}
            cta="Ver Coincidencias"
            colorClass="from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-400"
          />
        </CardContent>
      </Card>

      {/* Tus Estadísticas */}
      <Card className="rounded-xl shadow-lg border">
        <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <LayoutGrid className="h-7 w-7 text-primary" /> Tus Estadísticas
            </CardTitle>
            <CardDescription>Un resumen de tu actividad en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Propiedades Publicadas"
                    value={userTotalProperties}
                    icon={<Building />}
                    colorClass="text-green-500"
                    isLoading={isLoadingStats}
                />
                <StatCard
                    title="Solicitudes Publicadas"
                    value={userTotalRequests}
                    icon={<SearchCheck />}
                    colorClass="text-yellow-500"
                    isLoading={isLoadingStats}
                />
                <StatCard
                    title="Vistas a tus Propiedades"
                    value={userTotalPropertyViews}
                    icon={<Eye />}
                    colorClass="text-purple-500"
                    isLoading={isLoadingStats}
                />
                <StatCard
                    title="Consultas Recibidas"
                    value={userTotalPropertyInquiries}
                    icon={<MessageSquare />}
                    colorClass="text-teal-500"
                    isLoading={isLoadingStats}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
