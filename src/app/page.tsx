
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search as SearchIcon, AlertTriangle, Building, FileSearch } from "lucide-react";
import Link from "next/link";
import PropertyListItem from "@/components/property/PropertyListItem";
import RequestListItem from "@/components/request/RequestListItem"; // Actualizado de RequestCard a RequestListItem
import type { PropertyListing, SearchRequest } from "@/lib/types";
import { fetchGoogleSheetDataAction, getGoogleSheetConfigAction } from "@/actions/googleSheetActions";
import { getPropertiesAction } from "@/actions/propertyActions";
import { getRequestsAction } from "@/actions/requestActions"; // Asegúrate que esta acción esté implementada
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function GoogleSheetSection() {
  const config = await getGoogleSheetConfigAction();
  
  if (!config || !config.isConfigured) {
    return (
      <Card className="mt-10 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" /> Sección de Google Sheets no configurada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La sección para mostrar datos de Google Sheets aún no ha sido configurada por un administrador.
            Por favor, ve a <Link href="/admin/settings" className="text-primary hover:underline">la página de configuración</Link> para añadir los detalles de la hoja de cálculo.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const sheetData = await fetchGoogleSheetDataAction();

  if (!sheetData || sheetData.rows.length === 0) {
    return (
       <Card className="mt-10">
        <CardHeader>
          <CardTitle>Datos de Google Sheets</CardTitle>
           <CardDescription>No se pudieron cargar los datos de la hoja de cálculo o está vacía. Verifica la configuración.</CardDescription>
        </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground">Asegúrate de que el ID de la hoja, el nombre de la pestaña y las columnas sean correctos, y que la hoja esté compartida públicamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="py-10 bg-card rounded-lg shadow-md mt-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-headline font-semibold text-center mb-6">Datos de Nuestra Hoja de Cálculo</h2>
        <Table>
          <TableHeader>
            <TableRow>
              {sheetData.headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheetData.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {sheetData.headers.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}


export default async function HomePage() {
  const allProperties: PropertyListing[] = await getPropertiesAction();
  const featuredProperties = allProperties.slice(0, 3); 
  
  const allRequests: SearchRequest[] = await getRequestsAction();
  const recentRequests = allRequests.slice(0, 2);

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl md:text-6xl">
          Encuentra Tu Próxima <span className="text-primary">Propiedad</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Descubre, publica y comenta sobre propiedades en arriendo o venta. ¡O publica lo que estás buscando!
        </p>
        <div className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-3 px-4">
          <Input
            type="search"
            placeholder="Buscar por ubicación, tipo, palabras clave..."
            className="flex-grow text-base"
            aria-label="Buscar propiedades y solicitudes"
          />
          <Button size="lg" className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" /> Buscar
          </Button>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <Button size="lg" variant="default" asChild>
            <Link href="/properties/submit">
              <PlusCircle className="mr-2 h-5 w-5" /> Publicar una Propiedad
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/requests/submit">
              <PlusCircle className="mr-2 h-5 w-5" /> Publicar una Solicitud
            </Link>
          </Button>
        </div>
      </section>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="properties" className="text-base py-2.5">Propiedades Destacadas</TabsTrigger>
          <TabsTrigger value="requests" className="text-base py-2.5">Solicitudes Recientes</TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="mt-8">
          {featuredProperties.length > 0 ? (
            <div className="space-y-6">
              {featuredProperties.map((property) => (
                <PropertyListItem key={property.id} property={property} />
              ))}
            </div>
           ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-2" />
                <p>Aún no hay propiedades destacadas publicadas.</p>
            </div>
           )}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/properties">Ver Todas las Propiedades</Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="requests" className="mt-8">
          {recentRequests.length > 0 ? (
            <div className="space-y-6"> {/* Cambiado de grid a space-y-6 para formato de lista */}
              {recentRequests.map((request) => (
                <RequestListItem key={request.id} request={request} /> // Usando RequestListItem
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <FileSearch className="h-12 w-12 mx-auto mb-2" />
                <p>Aún no hay solicitudes recientes publicadas.</p>
            </div>
          )}
           <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/requests">Ver Todas las Solicitudes</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <section className="py-10 bg-card rounded-lg shadow-md">
         <div className="text-center">
            <h2 className="text-3xl font-headline font-semibold">Búsqueda Inteligente con IA</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Nuestra IA te ayuda a encontrar la propiedad o el arrendatario/comprador perfecto al relacionar inteligentemente los listados con las solicitudes de búsqueda.
            </p>
            <Button size="lg" className="mt-6" asChild>
                <Link href="/ai-matching">Descubrir Coincidencias</Link>
            </Button>
         </div>
      </section>

      <GoogleSheetSection />

    </div>
  );
}
