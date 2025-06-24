// src/app/requests/page.tsx
import RequestListItem from "@/components/request/RequestListItem";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import Link from "next/link";
import { getRequestsAction } from "@/actions/requestActions";
import SearchAndFilterControls from "@/components/search/SearchAndFilterControls"; // Reusable component
import type { SearchParams } from "@/lib/types";

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const searchTerm = searchParams?.searchTerm || '';

  const requests = await getRequestsAction({
    searchTerm: searchTerm,
    orderBy: searchTerm ? 'relevance' : 'createdAt_desc',
  });

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

      <SearchAndFilterControls 
        searchTarget="requests"
        initialSearchTerm={searchTerm}
        showPropertyTypeFilter
        showCategoryFilter
        showSortBy
      />

      {requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((request) => (
            <RequestListItem key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileSearch className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No se Encontraron Solicitudes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm 
              ? "No se encontraron solicitudes que coincidan con tu búsqueda. Intenta con otros términos."
              : "Actualmente no hay solicitudes publicadas. ¡O sé el primero en publicar una!"
            }
          </p>
          <Button className="mt-6" asChild>
            <Link href="/requests/submit">Publicar una Solicitud</Link>
          </Button>
        </div>
      )}

      {/* Placeholder for pagination */}
      {requests.length > 10 && ( 
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="mr-2" disabled>Anterior</Button>
          <Button variant="outline">Siguiente</Button>
        </div>
      )}
    </div>
  );
}
