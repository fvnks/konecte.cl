import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import PropertyCard from "@/components/property/PropertyCard";
import RequestCard from "@/components/request/RequestCard";
import { sampleProperties, sampleRequests } from "@/lib/types"; // Using placeholder data

export default function HomePage() {
  // In a real app, fetch this data
  const featuredProperties = sampleProperties.slice(0, 4);
  const recentRequests = sampleRequests.slice(0, 4);

  return (
    <div className="space-y-12">
      <section className="text-center py-10 bg-card rounded-lg shadow-md">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl md:text-6xl">
          Encuentra Tu Próxima <span className="text-primary">Propiedad</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Descubre, publica y comenta sobre propiedades en alquiler o venta. ¡O publica lo que estás buscando!
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {featuredProperties.length === 0 && <p className="text-center text-muted-foreground py-8">Aún no hay propiedades destacadas.</p>}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/properties">Ver Todas las Propiedades</Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="requests" className="mt-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:gap-x-8">
            {recentRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
          {recentRequests.length === 0 && <p className="text-center text-muted-foreground py-8">Aún no hay solicitudes recientes.</p>}
           <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/requests">Ver Todas las Solicitudes</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Placeholder for AI Matching Teaser */}
      <section className="py-10 bg-card rounded-lg shadow-md">
         <div className="text-center">
            <h2 className="text-3xl font-headline font-semibold">Búsqueda Inteligente con IA</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Nuestra IA inteligente te ayuda a encontrar la propiedad o el comprador/inquilino perfecto al relacionar inteligentemente los listados con las solicitudes de búsqueda.
            </p>
            <Button size="lg" className="mt-6" disabled>
                Descubrir Coincidencias (Próximamente)
            </Button>
         </div>
      </section>
    </div>
  );
}
