
// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PropertyListing, SearchRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import PropertyListItem from '@/components/property/PropertyListItem';
import RequestListItem from '@/components/request/RequestListItem';
import { Building, FileSearch, ArrowRight } from 'lucide-react';

interface FeaturedListingsClientProps {
  featuredProperties: PropertyListing[];
  recentRequests: SearchRequest[];
}

export default function FeaturedListingsClient({ featuredProperties, recentRequests }: FeaturedListingsClientProps) {
  const [activeView, setActiveView] = useState<'properties' | 'requests'>('properties');

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
        <div className="mt-2 space-y-8">
          {featuredProperties.length > 0 ? (
            featuredProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
              <Building className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-xl">Aún no hay propiedades destacadas.</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
              <Link href="/properties">Ver Todas las Propiedades <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      )}

      {activeView === 'requests' && (
        <div className="mt-2 space-y-8">
          {recentRequests.length > 0 ? (
            recentRequests.map((request) => (
              <RequestListItem key={request.id} request={request} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
              <FileSearch className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-xl">Aún no hay solicitudes recientes.</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild className="rounded-lg text-base hover:bg-primary/10 hover:text-primary hover:border-primary">
              <Link href="/requests">Ver Todas las Solicitudes <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
