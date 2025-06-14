
import type { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search as SearchIcon, AlertTriangle, Brain, ListChecks, DatabaseZap, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PropertyListing, SearchRequest, LandingSectionKey } from "@/lib/types";
import { fetchGoogleSheetDataAction, getGoogleSheetConfigAction } from "@/actions/googleSheetActions";
import { getPropertiesAction } from "@/actions/propertyActions";
import { getRequestsAction } from "@/actions/requestActions";
import { getSiteSettingsAction } from "@/actions/siteSettingsActions";
import { getEditableTextsByGroupAction } from '@/actions/editableTextActions'; // Importar la acción
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaginatedSheetTable from "@/components/google-sheet/PaginatedSheetTable"; 
import FeaturedListingsClient from '@/components/landing/FeaturedListingsClient';
import InteractiveAIMatching from '@/components/landing/InteractiveAIMatching';

export const dynamic = 'force-dynamic'; // Fuerza el renderizado dinámico para esta página

// --- Section Data Fetching (remains on server) ---

async function getFeaturedListingsAndRequestsData() {
  const allProperties: PropertyListing[] = await getPropertiesAction({limit: 8, orderBy: 'createdAt_desc'});
  const featuredProperties = allProperties; 
  
  const allRequests: SearchRequest[] = await getRequestsAction(); 
  const recentRequests = allRequests.slice(0, 8);
  return { featuredProperties, recentRequests };
}

// --- Section Components (Server or Client as appropriate) ---

function AIMatchingSection() {
  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="p-6 md:p-8">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
            <Brain className="h-8 w-8 mr-3 text-primary" />
            Búsqueda Inteligente con IA
        </CardTitle>
         <CardDescription className="text-lg text-muted-foreground mt-1">
              Ingresa los detalles de una propiedad y una solicitud de búsqueda para que nuestra IA evalúe su compatibilidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0 md:pt-0">
          <InteractiveAIMatching />
      </CardContent>
    </Card>
  );
}

async function GoogleSheetDataSection() {
  const config = await getGoogleSheetConfigAction();
  
  if (!config || !config.isConfigured) {
    return (
      <Card className="bg-muted/50 shadow-xl rounded-2xl">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-2xl md:text-3xl flex items-center"><AlertTriangle className="h-7 w-7 mr-3 text-yellow-600" /> Sección de Google Sheets no configurada</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="text-base text-muted-foreground">
            La sección para mostrar datos de Google Sheets aún no ha sido configurada por un administrador.
            Visita la <Link href="/admin/settings" className="text-primary hover:underline font-medium">página de configuración</Link> para activarla.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const sheetData = await fetchGoogleSheetDataAction();

  if (!sheetData) { 
    return (
       <Card className="shadow-xl rounded-2xl">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
            <DatabaseZap className="h-8 w-8 mr-3 text-primary" />
            Datos Externos
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground mt-1">No se pudieron cargar los datos de la hoja de cálculo. Verifica la configuración y la consola del servidor para más detalles.</CardDescription>
        </CardHeader>
         <CardContent className="p-6 md:p-8">
           <p className="text-base text-muted-foreground">Asegúrate de que el ID de la hoja, el nombre de la pestaña y las columnas sean correctos, y que la hoja esté compartida públicamente.</p>
        </CardContent>
      </Card>
    );
  }

  if (sheetData.rows.length === 0 && sheetData.headers.length > 0) {
     return (
       <Card className="shadow-xl rounded-2xl">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
             <DatabaseZap className="h-8 w-8 mr-3 text-primary" />
            Datos Externos
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground mt-1">La hoja de cálculo está configurada pero no contiene filas de datos (solo encabezados).</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
            <PaginatedSheetTable headers={sheetData.headers} rows={sheetData.rows} />
        </CardContent>
      </Card>
    );
  }
  
  if (sheetData.headers.length === 0) {
    return (
       <Card className="shadow-xl rounded-2xl">
        <CardHeader className="p-6 md:p-8">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
             <DatabaseZap className="h-8 w-8 mr-3 text-primary" />
            Datos Externos
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground mt-1">No se encontraron encabezados en la hoja de cálculo. Verifica los nombres de las columnas en la configuración y en la hoja.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl rounded-2xl">
        <CardHeader className="p-6 md:p-8">
         <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
            <DatabaseZap className="h-8 w-8 mr-3 text-primary" />
            Datos Externos de Google Sheets
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-1">Información adicional obtenida directamente desde nuestra hoja de cálculo configurada.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <PaginatedSheetTable headers={sheetData.headers} rows={sheetData.rows} />
      </CardContent>
    </Card>
  );
}


// --- HomePage Component ---
const DEFAULT_SECTIONS_ORDER: LandingSectionKey[] = ["featured_list_requests", "ai_matching", "google_sheet"];
const DEFAULT_HERO_TITLE = "Encuentra Tu Espacio Ideal en konecte";
const DEFAULT_HERO_SUBTITLE = "Descubre, publica y comenta sobre propiedades en arriendo o venta. ¡O publica lo que estás buscando!";
const DEFAULT_SEARCH_PLACEHOLDER = "Buscar por ubicación, tipo, características...";
const DEFAULT_PUBLISH_PROPERTY_BUTTON = "Publicar Propiedad";
const DEFAULT_PUBLISH_REQUEST_BUTTON = "Publicar Solicitud";


export default async function HomePage() {
  const siteSettings = await getSiteSettingsAction();
  const homeTexts = await getEditableTextsByGroupAction('home');

  const heroTitle = homeTexts.home_hero_title || DEFAULT_HERO_TITLE;
  const heroSubtitle = homeTexts.home_hero_subtitle || DEFAULT_HERO_SUBTITLE;
  const searchPlaceholder = homeTexts.home_search_placeholder || DEFAULT_SEARCH_PLACEHOLDER;
  const publishPropertyButtonText = homeTexts.home_publish_property_button || DEFAULT_PUBLISH_PROPERTY_BUTTON;
  const publishRequestButtonText = homeTexts.home_publish_request_button || DEFAULT_PUBLISH_REQUEST_BUTTON;


  const showFeaturedListings = siteSettings?.show_featured_listings_section === undefined ? true : siteSettings.show_featured_listings_section;
  const showAiMatching = siteSettings?.show_ai_matching_section === undefined ? true : siteSettings.show_ai_matching_section;
  const showGoogleSheet = siteSettings?.show_google_sheet_section === undefined ? true : siteSettings.show_google_sheet_section;
  
  const sectionsOrder = siteSettings?.landing_sections_order || DEFAULT_SECTIONS_ORDER;

  const { featuredProperties, recentRequests } = await getFeaturedListingsAndRequestsData();

  const sectionComponentsRender: Record<LandingSectionKey, () => ReactNode | null> = {
    featured_list_requests: () => showFeaturedListings ? (
      <Card className="shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6 md:p-8 bg-secondary/30">
          <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
            <ListChecks className="h-8 w-8 mr-3 text-primary" />
            Destacados y Recientes
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-1">Explora las últimas propiedades y las solicitudes de búsqueda más nuevas.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <FeaturedListingsClient 
            featuredProperties={featuredProperties}
            recentRequests={recentRequests}
          />
        </CardContent>
      </Card>
    ) : null,
    ai_matching: () => showAiMatching ? <AIMatchingSection /> : null,
    google_sheet: () => showGoogleSheet ? <GoogleSheetDataSection /> : null,
  };

  return (
    <div className="space-y-16 md:space-y-20"> 
      {/* Hero Section (Always Visible) */}
      <section className="text-center py-16 md:py-24 bg-card rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl !leading-tight"> 
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground sm:text-xl md:mt-8 md:text-2xl md:max-w-3xl">
            {heroSubtitle}
          </p>
          <div className="mt-12 max-w-2xl mx-auto"> 
            <form className="flex flex-col sm:flex-row gap-4"> 
              <Input
                type="search"
                placeholder={searchPlaceholder}
                className="flex-grow text-base h-14 rounded-xl shadow-md focus:ring-2 focus:ring-primary px-5" 
                aria-label="Buscar propiedades y solicitudes"
              />
              <Button size="lg" className="h-14 rounded-xl flex items-center gap-2 text-base shadow-md hover:shadow-lg transition-shadow px-8 bg-accent hover:bg-accent/90 text-accent-foreground" type="submit">
                <SearchIcon className="h-5 w-5" /> Buscar
              </Button>
            </form>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <Button size="lg" variant="default" asChild className="w-full sm:w-auto rounded-xl text-lg h-16 px-10 shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105">
              <Link href="/properties/submit">
                <PlusCircle className="mr-2.5 h-6 w-6" /> {publishPropertyButtonText}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto rounded-xl text-lg h-16 px-10 shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 bg-card hover:bg-muted">
              <Link href="/requests/submit">
                <PlusCircle className="mr-2.5 h-6 w-6" /> {publishRequestButtonText}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {sectionsOrder.map(key => {
         const SectionRenderer = sectionComponentsRender[key];
         return SectionRenderer ? <div key={key}>{SectionRenderer()}</div> : null;
      })}

    </div>
  );
}
    
