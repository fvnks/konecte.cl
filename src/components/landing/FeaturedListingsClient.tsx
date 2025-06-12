
// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PropertyListing, SearchRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
// PropertyListItem ya no se usa aquí, se usará FeaturedPropertyCard
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
import RequestCard from '@/components/request/RequestCard'; // RequestCard se usa
import { Building, FileSearch, ArrowRight } from 'lucide-react';

interface FeaturedListingsClientProps {
  featuredProperties: PropertyListing[];
  recentRequests: SearchRequest[];
}

export default function FeaturedListingsClient({ featuredProperties, recentRequests }: FeaturedListingsClientProps) {
  const [activeView, setActiveView] = useState<'properties' | 'requests'>('properties');

  // Limitar a 8 elementos para la cuadrícula (2 filas de 4)
  const propertiesToShow = featuredProperties.slice(0, 8);
  const requestsToShow = recentRequests.slice(0, 8);

  return (
    <>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Button
          variant={activeView === 'properties' ? 'default' : 'outline'}
          onClick={() => setActiveView('properties')}
          className="w-full py-3 text-base rounded-lg shadow-sm hover:shadow-md transition-shadow h-12"
        >
          Propiedades Destacadas
        </Button>
        <Button
          variant={activeView === 'requests' ? 'default' : 'outline'}
          onClick={() => setActiveView('requests')}
          className="w-full py-3 text-base rounded-lg shadow-sm hover:shadow-md transition-shadow h-12"
        >
          Solicitudes Recientes
        </Button>
      </div>

      {activeView === 'properties' && (
        <div>
          {propertiesToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {propertiesToShow.map((property) => (
                <FeaturedPropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
              <Building className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-xl">Aún no hay propiedades destacadas.</p>
            </div>
          )}
          {featuredProperties.length > 0 && ( // Mostrar botón solo si hay propiedades
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
                <Link href="/properties">Ver Todas las Propiedades <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {activeView === 'requests' && (
        <div>
          {requestsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {requestsToShow.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
              <FileSearch className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-xl">Aún no hay solicitudes recientes.</p>
            </div>
          )}
           {recentRequests.length > 0 && ( // Mostrar botón solo si hay solicitudes
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
                <Link href="/requests">Ver Todas las Solicitudes <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
           )}
        </div>
      )}
    </>
  );
}
