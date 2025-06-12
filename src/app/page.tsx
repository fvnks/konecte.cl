
import type { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search as SearchIcon, AlertTriangle, Building, FileSearch, Brain, ListChecks, DatabaseZap, ArrowRight } from "lucide-react";
import Link from "next/link";
import PropertyListItem from "@/components/property/PropertyListItem";
import RequestListItem from "@/components/request/RequestListItem";
import type { PropertyListing, SearchRequest, LandingSectionKey } from "@/lib/types";
import { fetchGoogleSheetDataAction, getGoogleSheetConfigAction } from "@/actions/googleSheetActions";
import { getPropertiesAction } from "@/actions/propertyActions";
import { getRequestsAction } from "@/actions/requestActions";
import { getSiteSettingsAction } from "@/actions/siteSettingsActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PaginatedSheetTable from "@/components/google-sheet/PaginatedSheetTable"; 

// --- Section Components ---

async function FeaturedListingsAndRequestsSection() {
  const allProperties: PropertyListing[] = await getPropertiesAction();
  const featuredProperties = allProperties.slice(0, 3); 
  
  const allRequests: SearchRequest[] = await getRequestsAction();
  const recentRequests = allRequests.slice(0, 2);

  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden"> {/* Increased rounding and shadow */}
      <CardHeader className="p-6 md:p-8 bg-secondary/30">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
          <ListChecks className="h-8 w-8 mr-3 text-primary" />
          Destacados y Recientes
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-1">Explora las últimas propiedades y las solicitudes de búsqueda más nuevas.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full sm:grid-cols-2 mb-8 rounded-lg bg-muted p-1"> {/* MODIFIED: p-1 (4px padding) */}
            <TabsTrigger 
              value="properties" 
              className="text-base px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-sm transition-all" /* MODIFIED: py-1.5, rounded-sm, shadow-sm */
            >
              Propiedades Destacadas
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="text-base px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-sm transition-all" /* MODIFIED: py-1.5, rounded-sm, shadow-sm */
            >
              Solicitudes Recientes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="properties" className="mt-2">
            {featuredProperties.length > 0 ? (
              <div className="space-y-8">
                {featuredProperties.map((property) => (
                  <PropertyListItem key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
                  <Building className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-xl">Aún no hay propiedades destacadas.</p>
              </div>
            )}
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
                <Link href="/properties">Ver Todas las Propiedades <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="requests" className="mt-2">
            {recentRequests.length > 0 ? (
              <div className="space-y-8"> 
                {recentRequests.map((request) => (
                  <RequestListItem key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
                  <FileSearch className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                  <p className="text-xl">Aún no hay solicitudes recientes.</p>
              </div>
            )}
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
                <Link href="/requests">Ver Todas las Solicitudes <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AIMatchingSection() {
  return (
    <Card className="shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary"> {/* Gradient background */}
      <CardHeader className="p-6 md:p-8 text-primary-foreground">
        <CardTitle className="text-3xl md:text-4xl font-headline flex items-center">
            <Brain className="h-8 w-8 mr-3" />
            Búsqueda Inteligente con IA
        </CardTitle>
         <CardDescription className="text-lg text-primary-foreground/80 mt-1">
              Nuestra IA te ayuda a encontrar la propiedad o el arrendatario/comprador perfecto.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center p-6 md:p-8">
          <p className="mt-1 text-primary-foreground/90 max-w-2xl mx-auto text-lg leading-relaxed">
              Relacionamos inteligentemente los listados con las solicitudes de búsqueda para ofrecerte las mejores coincidencias.
          </p>
          <Button size="lg" variant="secondary" className="mt-8 text-base h-14 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/ai-matching">Descubrir Coincidencias <ArrowRight className="ml-2 h-5 w-5"/></Link>
          </Button>
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
           <CardDescription className="text-lg text-muted-foreground mt-1">No se pudieron cargar los datos de la hoja de cálculo. Verifica la configuración.</CardDescription>
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

export default async function HomePage() {
  const siteSettings = await getSiteSettingsAction();
  const siteTitle = siteSettings?.siteTitle || 'Encuentra Tu Próxima Propiedad';

  const showFeaturedListings = siteSettings?.show_featured_listings_section === undefined ? true : siteSettings.show_featured_listings_section;
  const showAiMatching = siteSettings?.show_ai_matching_section === undefined ? true : siteSettings.show_ai_matching_section;
  const showGoogleSheet = siteSettings?.show_google_sheet_section === undefined ? true : siteSettings.show_google_sheet_section;
  
  const sectionsOrder = siteSettings?.landing_sections_order || DEFAULT_SECTIONS_ORDER;

  const sectionComponents: Record<LandingSectionKey, ReactNode | null> = {
    featured_list_requests: showFeaturedListings ? <FeaturedListingsAndRequestsSection /> : null,
    ai_matching: showAiMatching ? <AIMatchingSection /> : null,
    google_sheet: showGoogleSheet ? <GoogleSheetDataSection /> : null,
  };

  return (
    <div className="space-y-16 md:space-y-20"> {/* Increased spacing */}
      {/* Hero Section (Always Visible) */}
      <section className="text-center py-16 md:py-24 bg-card rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl !leading-tight"> {/* Increased leading */}
            {siteTitle.includes('PropSpot') ? siteTitle.replace('PropSpot', '').trim() : siteTitle}
            {siteTitle.includes('PropSpot') && <span className="text-primary"> PropSpot</span>}
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground sm:text-xl md:mt-8 md:text-2xl md:max-w-3xl">
            Descubre, publica y comenta sobre propiedades en arriendo o venta. ¡O publica lo que estás buscando!
          </p>
          <div className="mt-12 max-w-2xl mx-auto"> {/* Increased width */}
            <form className="flex flex-col sm:flex-row gap-4"> {/* Increased gap */}
              <Input
                type="search"
                placeholder="Buscar por ubicación, tipo, características..."
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
                <PlusCircle className="mr-2.5 h-6 w-6" /> Publicar Propiedad
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto rounded-xl text-lg h-16 px-10 shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 bg-card hover:bg-muted">
              <Link href="/requests/submit">
                <PlusCircle className="mr-2.5 h-6 w-6" /> Publicar Solicitud
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {sectionsOrder.map(key => {
         const SectionComponent = sectionComponents[key];
         return SectionComponent ? <div key={key}>{SectionComponent}</div> : null;
      })}

    </div>
  );
}

