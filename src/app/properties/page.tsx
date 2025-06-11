// src/app/properties/page.tsx
import PropertyListItem from "@/components/property/PropertyListItem"; // Cambiado de PropertyCard
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sampleProperties } from "@/lib/types"; // Usando datos de ejemplo
import { Filter, ListFilter, Search } from "lucide-react";
import Link from "next/link";

export default function PropertiesPage() {
  // En una aplicación real, obtendrías y filtrarías estos datos
  const properties = sampleProperties;

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-card rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-headline font-bold">Propiedades</h1>
          <p className="text-muted-foreground">Explora todas las propiedades disponibles para alquilar o vender.</p>
        </div>
        <Button asChild>
          <Link href="/properties/submit">Publica Tu Propiedad</Link>
        </Button>
      </section>

      <div className="p-4 bg-card rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Buscar por ubicación, título, características..." className="pl-10 w-full" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
           <Select defaultValue="latest">
            <SelectTrigger className="w-full md:w-[200px]"> {/* Increased width for longer text */}
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Más Recientes</SelectItem>
              <SelectItem value="price_asc">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="price_desc">Precio: Mayor a Menor</SelectItem>
              <SelectItem value="popular">Populares</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Placeholder for advanced filters */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <Select placeholder="Type (Rent/Sale)" />
          <Select placeholder="Category" />
          <Input type="number" placeholder="Min. Bedrooms" />
          <Input type="number" placeholder="Max. Price" />
        </div> */}
      </div>
      
      {properties.length > 0 ? (
        <div className="space-y-6"> {/* Cambiado a space-y-6 para un layout de lista */}
          {properties.map((property) => (
            <PropertyListItem key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No se Encontraron Propiedades</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Intenta ajustar tu búsqueda o filtros. ¡O sé el primero en publicar una!
          </p>
          <Button className="mt-6" asChild>
            <Link href="/properties/submit">Publicar una Propiedad</Link>
          </Button>
        </div>
      )}
       {/* Placeholder de Paginación */}
      <div className="flex justify-center mt-8">
        <Button variant="outline" className="mr-2" disabled>Anterior</Button>
        <Button variant="outline">Siguiente</Button>
      </div>
    </div>
  );
}
