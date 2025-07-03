// src/app/page.tsx
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Brain, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import type { PropertyListing, SearchRequest, LandingSectionKey, Plan } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FeaturedListingsClient from '@/components/landing/FeaturedListingsClient';
import InteractiveAIMatching from '@/components/landing/InteractiveAIMatching';
import PlanDisplayCard from '@/components/plan/PlanDisplayCard';
import HeroSection from '@/components/landing/HeroSection';
import StaticText from '@/components/ui/StaticText';

// --- NEW DATA IMPORTS ---
import { getProperties, getPropertiesCount } from '@/lib/data/properties';
import { getRequests, getRequestsCount } from '@/lib/data/requests';
import { getSiteSettings } from '@/lib/data/siteSettings';
import { getPlans } from '@/lib/data/plans';

// Configuración de revalidación para asegurar datos frescos
export const dynamic = 'force-dynamic'; // Fuerza la regeneración en cada solicitud
export const revalidate = 30; // Revalidación adicional cada 30 segundos como respaldo

const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "featured_plans", "ai_matching", "analisis_whatsbot"];

// --- Data Fetching Functions ---
async function getFeaturedListingsAndRequestsData() {
  console.log('[DEBUG] Fetching featured listings and requests data');
  
  // Obtener todas las propiedades y solicitudes, sin filtros de fecha
  const [allProperties, allRequests] = await Promise.all([
    getProperties({ 
      limit: 50, 
      orderBy: 'createdAt_desc',
      includeInactive: false // Solo mostrar activas
    }),
    getRequests({ 
      includeInactive: false, // Solo mostrar activas
      limit: 50, 
      orderBy: 'createdAt_desc' 
    })
  ]);
  
  console.log(`[DEBUG] Found ${allProperties.length} properties and ${allRequests.length} requests`);
  
  // Mostrar detalles de las primeras propiedades/solicitudes para depuración
  if (allProperties.length > 0) {
    console.log('[DEBUG] First property:', JSON.stringify({
      id: allProperties[0].id,
      title: allProperties[0].title,
      createdAt: allProperties[0].createdAt
    }));
  }
  
  if (allRequests.length > 0) {
    console.log('[DEBUG] First request:', JSON.stringify({
      id: allRequests[0].id,
      title: allRequests[0].title,
      createdAt: allRequests[0].createdAt
    }));
  }
  
  return { featuredProperties: allProperties, recentRequests: allRequests };
}

async function getFeaturedPlansData(limit: number = 3) {
  const plans = await getPlans({ showAllAdmin: false });
  return plans.sort((a, b) => a.price_monthly - b.price_monthly).slice(0, limit);
}

// --- Section Components (can be Server Components) ---

function AIMatchingSection() {
  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center text-foreground">
          <Brain className="h-8 w-8 mr-3 text-primary" />
          <StaticText id="landing:ai-matching-title" textType="span">
            IA: Describe tu Búsqueda Ideal
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText id="landing:ai-matching-description" textType="span">
            Escribe lo que buscas (tipo de propiedad, características, ubicación, etc.) y nuestra IA buscará propiedades y solicitudes compatibles en la plataforma.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0">
        <InteractiveAIMatching 
          searchLabel={
            <StaticText id="landing:ai-search-label" textType="span">
              Describe lo que buscas
            </StaticText>
          }
          resultsTitle={
            <StaticText id="landing:ai-results-title" textType="span">
              Resultados de la búsqueda
            </StaticText>
          }
          resultsSubtitle={
            <StaticText id="landing:ai-results-subtitle" textType="span">
              Hemos encontrado estas propiedades que coinciden con tu búsqueda
            </StaticText>
          }
          viewDetailsText={
            <StaticText id="landing:ai-view-details" textType="span">
              Ver detalles
            </StaticText>
          }
          noResultsText={
            <StaticText id="landing:ai-no-results" textType="span">
              No encontramos propiedades que coincidan con tu búsqueda.
            </StaticText>
          }
          viewAllPropertiesText={
            <StaticText id="landing:ai-view-all-properties" textType="span">
              Ver todas las propiedades
            </StaticText>
          }
          errorTitle={
            <StaticText id="landing:ai-error-title" textType="span">
              Error al procesar la búsqueda
            </StaticText>
          }
        />
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
            <StaticText id="landing:plans-empty-title" textType="span">
              Planes Destacados
            </StaticText>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-base text-muted-foreground">
            <StaticText id="landing:plans-empty-description" textType="span">
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
          <StaticText id="landing:plans-title" textType="span">
            Planes para Profesionales
          </StaticText>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          <StaticText id="landing:plans-subtitle" textType="span">
            Potencia tu negocio inmobiliario con nuestras herramientas profesionales.
          </StaticText>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanDisplayCard key={plan.id} plan={plan} />
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

function FeaturedListingsSection({ 
  featuredProperties, 
  recentRequests,
  propertyCount,
  requestCount,
}: { 
  featuredProperties: PropertyListing[], 
  recentRequests: SearchRequest[],
  propertyCount: number,
  requestCount: number,
}) {
  const mappedProperties = featuredProperties.map(p => ({
    id: p.id,
    pub_id: p.pub_id,
    title: p.title,
    price: p.price,
    listingType: p.propertyType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareMeters: p.totalAreaSqMeters,
    location: { city: p.city, region: p.region },
    images: p.images,
    author: p.author,
    source: p.source,
    slug: p.slug,
    city: p.city,
  }));
  const mappedRequests = recentRequests.map(r => ({
    ...r,
    listingType: r.desiredPropertyType[0] || 'rent',
    budget: r.budgetMax,
    location: { city: r.desiredLocation.city, region: r.desiredLocation.region }
  }));

  return (
    <FeaturedListingsClient 
      featuredProperties={mappedProperties} 
      recentRequests={mappedRequests} 
      propertyCount={propertyCount}
      requestCount={requestCount}
      noPropertiesMessage={
        <StaticText id="landing:no-properties" textType="span">
          No hay propiedades destacadas
        </StaticText>
      }
      noRequestsMessage={
        <StaticText id="landing:no-requests" textType="span">
          No hay solicitudes destacadas
        </StaticText>
      }
      viewAllPropertiesText={
        <StaticText id="landing:view-all-properties" textType="span">
          Ver Todas las Propiedades
        </StaticText>
      }
      viewAllRequestsText={
        <StaticText id="landing:view-all-requests" textType="span">
          Ver Todas las Solicitudes
        </StaticText>
      }
    />
  );
}

// --- Loading and Content Components ---

function PageLoader() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] py-20">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <p className="text-lg text-muted-foreground">Cargando contenido...</p>
    </div>
  );
}

async function PageContent() {
  // Fetch all data for the page sections in parallel
  const [
    siteSettings, 
    listingsData, 
    featuredPlansData,
    propertyCount,
    requestCount,
  ] = await Promise.all([
    getSiteSettings(),
    getFeaturedListingsAndRequestsData(),
    getFeaturedPlansData(3),
    getPropertiesCount(),
    getRequestsCount(),
  ]);

  const showFeaturedListings = siteSettings?.show_featured_listings_section ?? true;
  const showFeaturedPlans = siteSettings?.show_featured_plans_section ?? true;
  const showAiMatching = siteSettings?.show_ai_matching_section ?? true;
  const sectionsOrder = siteSettings?.landing_sections_order || DEFAULT_SECTIONS_ORDER;

  const sectionComponentsRender: Record<LandingSectionKey, () => ReactNode | null> = {
    featured_list_requests: () => showFeaturedListings && listingsData ? (
      <FeaturedListingsSection 
        featuredProperties={listingsData.featuredProperties} 
        recentRequests={listingsData.recentRequests}
        propertyCount={propertyCount}
        requestCount={requestCount}
      />
    ) : null,
    featured_plans: () => showFeaturedPlans && featuredPlansData ? <FeaturedPlansSection plans={featuredPlansData} /> : null,
    ai_matching: () => showAiMatching ? <AIMatchingSection /> : null,
    analisis_whatsbot: () => null, // Placeholder for this section
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12 md:space-y-20">
      {sectionsOrder.map(key => {
        const SectionRenderer = sectionComponentsRender[key];
        return SectionRenderer ? <div key={key}>{SectionRenderer()}</div> : null;
      })}
    </div>
  );
}

// --- HomePage Component (now a Server Component) ---
export default function HomePage() {
  const heroTitle = (
    <StaticText id="landing:hero-title" textType="span">
      ENCUENTRA LA PROPIEDAD Y/O SOLICITUD (CLIENTE) QUE BUSCAS
    </StaticText>
  );

  const heroSubtitle = (
    <StaticText id="landing:hero-subtitle" textType="span">
      Publica gratis. Gestiona con inteligencia. Conecta con oportunidad
    </StaticText>
  );
  
  return (
    <>
      <HeroSection title={heroTitle} subtitle={heroSubtitle} />
      
      <Suspense fallback={<PageLoader />}>
        <PageContent />
      </Suspense>
    </>
  );
}
