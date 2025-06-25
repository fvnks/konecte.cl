// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PropertyListing, SearchRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import FeaturedPropertyCard from '@/components/property/FeaturedPropertyCard';
import RequestCard from '@/components/request/RequestCard';
import { Building, FileSearch, ArrowRight } from 'lucide-react';
import AnimatedLinkButton from '@/components/ui/AnimatedLinkButton';
import EditableText from '@/components/ui/EditableText';

interface FeaturedListingsClientProps {
  featuredProperties: PropertyListing[];
  recentRequests: SearchRequest[];
}

export default function FeaturedListingsClient({ featuredProperties, recentRequests }: FeaturedListingsClientProps) {
  const [activeView, setActiveView] = useState<'properties' | 'requests'>('properties');

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
          <EditableText id="landing:properties-tab-button" textType="span">
            Propiedades Destacadas
          </EditableText>
        </Button>
        <Button
          variant={activeView === 'requests' ? 'default' : 'outline'}
          onClick={() => setActiveView('requests')}
          className="w-full py-3 text-base rounded-lg shadow-sm hover:shadow-md transition-shadow h-12"
        >
          <EditableText id="landing:requests-tab-button" textType="span">
            Solicitudes Recientes
          </EditableText>
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
              <p className="text-xl">
                <EditableText id="landing:no-properties-message" textType="span">
                  Aún no hay propiedades destacadas.
                </EditableText>
              </p>
            </div>
          )}
          {featuredProperties.length > 0 && (
            <div className="mt-10 text-center">
              <AnimatedLinkButton href="/properties">
                <EditableText id="landing:view-all-properties-button" textType="span">
                  Ver todas las propiedades
                </EditableText>
              </AnimatedLinkButton>
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
              <p className="text-xl">
                <EditableText id="landing:no-requests-message" textType="span">
                  Aún no hay solicitudes recientes.
                </EditableText>
              </p>
            </div>
          )}
           {recentRequests.length > 0 && (
            <div className="mt-10 text-center">
              <AnimatedLinkButton href="/requests">
                <EditableText id="landing:view-all-requests-button" textType="span">
                  Ver Todas
                </EditableText>
              </AnimatedLinkButton>
            </div>
           )}
        </div>
      )}
    </>
  );
}
