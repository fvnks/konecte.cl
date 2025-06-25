// src/app/page.tsx
'use client'; 

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, Brain, ListChecks, Bot, ArrowRight, Link as LinkIcon, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import type { PropertyListing, SearchRequest, LandingSectionKey, Plan } from "@/lib/types";
import { fetchGoogleSheetDataAction, getGoogleSheetConfigAction } from "@/actions/googleSheetActions";
import { getPropertiesAction } from "@/actions/propertyActions";
import { getRequestsAction } from "@/actions/requestActions";
import { getSiteSettingsAction } from "@/actions/siteSettingsActions";
import { getEditableTextsByGroupAction } from '@/actions/editableTextActions';
import { getPlansAction } from '@/actions/planActions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PaginatedSheetTable from "@/components/google-sheet/PaginatedSheetTable";
import FeaturedListingsClient from '@/components/landing/FeaturedListingsClient';
import InteractiveAIMatching from '@/components/landing/InteractiveAIMatching';
import PlanDisplayCard from '@/components/plan/PlanDisplayCard';
import HeroSearchForm from '@/components/landing/HeroSearchForm';
import HeroSection from '@/components/landing/HeroSection';
import StaticText from '@/components/ui/StaticText';


async function getFeaturedListingsAndRequestsData() {
  const [allProperties, allRequests] = await Promise.all([
    getPropertiesAction({ limit: 8, orderBy: 'random' }),
    getRequestsAction({ includeInactive: false, limit: 8, orderBy: 'random' })
  ]);
  const featuredProperties = allProperties;
  const recentRequests = allRequests;
  return { featuredProperties, recentRequests };
}

async function getFeaturedPlansData(limit: number = 3) {
  const plans = await getPlansAction({ showAllAdmin: false }); // This already fetches only active and visible
  return plans.sort((a,b) => a.price_monthly - b.price_monthly).slice(0, limit); // Ensure consistent order for "featured"
}

// --- Section Components ---

function AIMatchingSection() {
  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
          <Brain className="h-8 w-8 mr-3 text-primary" />
          <StaticText
            id="landing:ai-matching-title"
            textType="span"
          >
          IA: Describe tu Búsqueda Ideal
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText
            id="landing:ai-matching-description"
            textType="span"
          >
          Escribe lo que buscas (tipo de propiedad, características, ubicación, etc.) y nuestra IA buscará propiedades y solicitudes compatibles en la plataforma.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0">
        <InteractiveAIMatching />
      </CardContent>
    </Card>
  );
}

function AnalisisWhatsBotSectionClient({ initialConfig, initialSheetData }: { initialConfig: Awaited<ReturnType<typeof getGoogleSheetConfigAction>>, initialSheetData: Awaited<ReturnType<typeof fetchGoogleSheetDataAction>> }) {
  if (!initialConfig || !initialConfig.isConfigured) {
    return (
      <Card className="bg-muted/30 shadow-lg rounded-2xl border border-dashed">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-2xl md:text-3xl flex items-center text-muted-foreground">
            <AlertTriangle className="h-7 w-7 mr-3 text-yellow-500" />
            <StaticText
              id="landing:whatsbot-unconfigured-title"
              textType="span"
            >
            Análisis WhatsBot
            </StaticText>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-base text-muted-foreground">
            <StaticText
              id="landing:whatsbot-unconfigured-description"
              textType="span"
            >
            Esta sección mostrará datos para el Análisis WhatsBot, pero aún no ha sido configurada.
              Un administrador puede habilitarla desde el panel de configuración.
            </StaticText>
            <Link href="/admin/settings" className="text-primary hover:underline font-medium ml-1">panel de configuración</Link>.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!initialSheetData) {
    return (
      <Card className="shadow-xl rounded-2xl border bg-card">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
            <Bot className="h-8 w-8 mr-3 text-primary" />
            <StaticText
              id="landing:whatsbot-error-title"
              textType="span"
            >
            Análisis WhatsBot
            </StaticText>
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            <StaticText
              id="landing:whatsbot-error-description"
              textType="span"
            >
              No se pudieron cargar los datos. Verifica la configuración y la consola del servidor para más detalles.
            </StaticText>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-base text-muted-foreground">
            <StaticText
              id="landing:whatsbot-error-help"
              textType="span"
            >
              Asegúrate de que el ID de la hoja, el nombre de la pestaña y las columnas sean correctos, y que la hoja esté compartida públicamente.
            </StaticText>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (initialSheetData.rows.length === 0 && initialSheetData.headers.length > 0) {
    return (
      <Card className="shadow-xl rounded-2xl border bg-card">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
            <Bot className="h-8 w-8 mr-3 text-primary" />
            <StaticText
              id="landing:whatsbot-empty-title"
              textType="span"
            >
            Análisis WhatsBot
            </StaticText>
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            <StaticText
              id="landing:whatsbot-empty-description"
              textType="span"
            >
              La fuente de datos está configurada pero no contiene filas de datos (solo encabezados).
            </StaticText>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <PaginatedSheetTable headers={initialSheetData.headers} rows={initialSheetData.rows} />
        </CardContent>
      </Card>
    );
  }

  if (initialSheetData.headers.length === 0) {
    return (
      <Card className="shadow-xl rounded-2xl border bg-card">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
            <Bot className="h-8 w-8 mr-3 text-primary" />
            <StaticText
              id="landing:whatsbot-no-headers-title"
              textType="span"
            >
            Análisis WhatsBot
            </StaticText>
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            <StaticText
              id="landing:whatsbot-no-headers-description"
              textType="span"
            >
              No se encontraron encabezados en la fuente de datos. Verifica la configuración.
            </StaticText>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl rounded-2xl border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
          <Bot className="h-8 w-8 mr-3 text-primary" />
          <StaticText
            id="landing:whatsbot-title"
            textType="span"
          >
          Análisis WhatsBot
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText
            id="landing:whatsbot-description"
            textType="span"
          >
            Información relevante para el análisis de interacciones del bot.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <PaginatedSheetTable headers={initialSheetData.headers} rows={initialSheetData.rows} />
      </CardContent>
    </Card>
  );
}

interface FeaturedPlansSectionProps {
  plans: Plan[];
}
function FeaturedPlansSection({ plans }: FeaturedPlansSectionProps) {
  if (!plans || plans.length === 0) {
    return (
      <Card className="bg-muted/30 shadow-lg rounded-2xl border border-dashed">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-2xl md:text-3xl flex items-center text-muted-foreground">
            <CreditCard className="h-7 w-7 mr-3 text-yellow-500" />
            <StaticText
              id="landing:plans-empty-title"
              textType="span"
            >
            Planes Destacados
            </StaticText>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-base text-muted-foreground">
            <StaticText
              id="landing:plans-empty-description"
              textType="span"
            >
            Actualmente no hay planes destacados para mostrar. Visita nuestra página de planes para más información.
            </StaticText>
          </p>
          <Button asChild variant="link" className="mt-3 px-0">
            <Link href="/plans">
              Ver planes disponibles <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl rounded-2xl border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
          <CreditCard className="h-8 w-8 mr-3 text-primary" />
          <StaticText
            id="landing:plans-title"
            textType="span"
          >
          Planes para Profesionales
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText
            id="landing:plans-subtitle"
            textType="span"
          >
            Potencia tu negocio inmobiliario con nuestras herramientas profesionales.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanDisplayCard key={plan.id} plan={plan} showActions={false} />
        ))}
      </CardContent>
      <CardFooter className="p-6 md:p-8 pt-0 md:pt-0 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/plans">
            Ver todos los planes <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeaturedListingsSection({ featuredProperties, recentRequests }: { featuredProperties: PropertyListing[], recentRequests: SearchRequest[] }) {
  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
          <ListChecks className="h-8 w-8 mr-3 text-primary" />
          <StaticText
            id="landing:featured-listings-title"
            textType="span"
          >
            Propiedades y Solicitudes Destacadas
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText
            id="landing:featured-listings-description"
            textType="span"
          >
          Explora las últimas propiedades y solicitudes agregadas a nuestra plataforma.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0">
        <FeaturedListingsClient featuredProperties={featuredProperties} recentRequests={recentRequests} />
      </CardContent>
    </Card>
  );
}

const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];
const DEFAULT_HERO_TITLE = "Encuentra Tu Espacio Ideal en konecte";
const DEFAULT_HERO_SUBTITLE = "Descubre, publica y comenta sobre propiedades en arriendo o venta. Publicaciones ilimitadas, sin costo. ¡O publica lo que estás buscando!";
const DEFAULT_PUBLISH_PROPERTY_BUTTON = "Publicar Propiedad";
const DEFAULT_PUBLISH_REQUEST_BUTTON = "Publicar Solicitud";

// --- HomePage Component ---
export default function HomePage() {
  const [siteSettings, setSiteSettings] = useState<Awaited<ReturnType<typeof getSiteSettingsAction>> | null>(null);
  const [homeTexts, setHomeTexts] = useState<Awaited<ReturnType<typeof getEditableTextsByGroupAction>> | null>(null);
  const [listingsData, setListingsData] = useState<Awaited<ReturnType<typeof getFeaturedListingsAndRequestsData>> | null>(null);
  const [featuredPlansData, setFeaturedPlansData] = useState<Awaited<ReturnType<typeof getFeaturedPlansData>> | null>(null);
  const [googleSheetConfig, setGoogleSheetConfig] = useState<Awaited<ReturnType<typeof getGoogleSheetConfigAction>> | null>(null);
  const [googleSheetData, setGoogleSheetData] = useState<Awaited<ReturnType<typeof fetchGoogleSheetDataAction>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setErrorLoading(null);
      try {
        // Paralelizar las llamadas independientes
        const [
          settings,
          texts,
          listings,
          plans,
          gSheetConfigResult
        ] = await Promise.all([
          getSiteSettingsAction(),
          getEditableTextsByGroupAction('landing'),
          getFeaturedListingsAndRequestsData(),
          getFeaturedPlansData(3),
          getGoogleSheetConfigAction()
        ]);

        setSiteSettings(settings);
        setHomeTexts(texts);
        setListingsData(listings);
        setFeaturedPlansData(plans);
        setGoogleSheetConfig(gSheetConfigResult);

        // Carga condicional de datos de Google Sheet
        if (gSheetConfigResult && gSheetConfigResult.isConfigured) {
          const gSheetDataResult = await fetchGoogleSheetDataAction();
          setGoogleSheetData(gSheetDataResult);
        }

      } catch (error: any) {
        console.error("Error loading initial data for HomePage:", error);
        setErrorLoading(error.message || "Ocurrió un error al cargar los datos de la página.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando contenido...</p>
        </div>
    );
  }
  
  if (errorLoading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] py-20">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar la página</h2>
        <p className="text-muted-foreground">{errorLoading}</p>
        </div>
    );
  }
  
  if (!siteSettings || !homeTexts || !listingsData || !featuredPlansData) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
            <h1 className="text-2xl font-bold mb-3">Error Inesperado</h1>
            <p className="text-lg text-muted-foreground mb-8">No se pudieron cargar todos los datos necesarios para mostrar la página. Por favor, intenta recargar.</p>
            <Button onClick={() => window.location.reload()}>Recargar Página</Button>
        </div>
    );
  }


  const showFeaturedListings = siteSettings?.show_featured_listings_section === undefined ? true : siteSettings.show_featured_listings_section;
  const showFeaturedPlans = siteSettings?.show_featured_plans_section === undefined ? true : siteSettings.show_featured_plans_section;
  const showAiMatching = siteSettings?.show_ai_matching_section === undefined ? true : siteSettings.show_ai_matching_section;
  const showAnalisisWhatsBot = siteSettings?.show_google_sheet_section === undefined ? true : siteSettings.show_google_sheet_section;
  const sectionsOrder = siteSettings?.landing_sections_order || DEFAULT_SECTIONS_ORDER;

  const sectionComponentsRender: Record<LandingSectionKey, () => ReactNode | null> = {
    featured_list_requests: () => showFeaturedListings && listingsData ? (
      <FeaturedListingsSection featuredProperties={listingsData.featuredProperties} recentRequests={listingsData.recentRequests} />
    ) : null,
    featured_plans: () => showFeaturedPlans && featuredPlansData ? <FeaturedPlansSection plans={featuredPlansData} /> : null,
    ai_matching: () => showAiMatching ? <AIMatchingSection /> : null,
    analisis_whatsbot: () => showAnalisisWhatsBot ? <AnalisisWhatsBotSectionClient initialConfig={googleSheetConfig} initialSheetData={googleSheetData} /> : null,
  };
  
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section with Editable Text */}
      <HeroSection />

      {/* Main Content Sections */}
      <div className="container py-12 md:py-16 space-y-12 md:space-y-20">
      {sectionsOrder.map(key => {
        const SectionRenderer = sectionComponentsRender[key];
        return SectionRenderer ? <div key={key}>{SectionRenderer()}</div> : null;
      })}
    </div>
    </main>
  );
}
