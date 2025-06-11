
// src/app/requests/page.tsx
import RequestCard from "@/components/request/RequestCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchRequest } from "@/lib/types"; // Import type
import { Filter, ListFilter, Search as SearchIconLucide } from "lucide-react";
import Link from "next/link";

export default function RequestsPage() {
  // TODO: Implementar carga desde BD
  // En una aplicación real, aquí obtendrías y filtrarías estos datos desde tu backend/DB.
  const requests: SearchRequest[] = []; 

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-card rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-headline font-bold">Solicitudes de Propiedad</h1>
          <p className="text-muted-foreground">Explora lo que otros están buscando.</p>
        </div>
        <Button asChild>
          <Link href="/requests/submit">Publica Tu Solicitud</Link>
        </Button>
      </section>

      <div className="p-4 bg-card rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <SearchIconLucide className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Buscar solicitudes por ubicación, tipo..." className="pl-10 w-full" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Select defaultValue="latest">
            <SelectTrigger className="w-full md:w-[180px]">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Más Recientes</SelectItem>
              <SelectItem value="oldest">Más Antiguos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {requests.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <SearchIconLucide className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No se Encontraron Solicitudes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Actualmente no hay solicitudes publicadas. ¡O sé el primero en publicar una!
          </p>
          <Button className="mt-6" asChild>
            <Link href="/requests/submit">Publicar una Solicitud</Link>
          </Button>
        </div>
      )}

      {/* Pagination Placeholder - Consider removing or implementing if not used soon */}
      {requests.length > 10 && ( // Show pagination only if there are enough items
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="mr-2" disabled>Anterior</Button>
          <Button variant="outline">Siguiente</Button>
        </div>
      )}
    </div>
  );
}
