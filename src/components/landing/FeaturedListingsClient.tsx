// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building, FileSearch, ArrowRight, Loader2, Home, MapPin, BedDouble, Bath, Maximize2, Search } from 'lucide-react';
import StaticText from '@/components/ui/StaticText';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks } from "lucide-react";

// Definir las interfaces para los tipos
interface Property {
  id: string;
  title: string;
  description?: string;
  price?: number;
  listingType: 'rent' | 'sale';
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  location?: {
    city?: string;
    region?: string;
  };
  images?: string[];
  user?: {
    name?: string;
  };
}

interface PropertyRequest {
  id: string;
  title: string;
  description?: string;
  budget?: number;
  listingType: 'rent' | 'sale';
  bedrooms?: number;
  bathrooms?: number;
  location?: {
    city?: string;
    region?: string;
  };
  user?: {
    name?: string;
  };
}

export default function FeaturedListingsClient() {
  const [activeTab, setActiveTab] = useState<'properties' | 'requests'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        // Fetch featured properties
        const propertiesResponse = await fetch('/api/properties/featured');
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData);

        // Fetch featured requests
        const requestsResponse = await fetch('/api/requests/featured');
        const requestsData = await requestsResponse.json();
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching featured listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            <StaticText id="landing:featured-listings-title" textType="span">
              Propiedades y Solicitudes Destacadas
            </StaticText>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            <StaticText id="landing:featured-listings-description" textType="span">
              Explora las últimas propiedades y solicitudes agregadas a nuestra plataforma.
            </StaticText>
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg overflow-hidden border">
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'properties' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'
                }`}
                onClick={() => setActiveTab('properties')}
              >
                <StaticText id="landing:tab-properties" textType="span">
                  Propiedades
                </StaticText>
                <span className="ml-2 bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full text-xs">
                  {properties.length}
                </span>
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'requests' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'
                }`}
                onClick={() => setActiveTab('requests')}
              >
                <StaticText id="landing:tab-requests" textType="span">
                  Solicitudes
                </StaticText>
                <span className="ml-2 bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full text-xs">
                  {requests.length}
                </span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'properties' ? (
            properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => (
                  <FeaturedPropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  <StaticText id="landing:no-properties" textType="span">
                    No hay propiedades destacadas
                  </StaticText>
                </h3>
                <p className="text-muted-foreground">
                  Las propiedades destacadas aparecerán aquí pronto.
                </p>
              </div>
            )
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {requests.map((request) => (
                <FeaturedRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">
                <StaticText id="landing:no-requests" textType="span">
                  No hay solicitudes destacadas
                </StaticText>
              </h3>
              <p className="text-muted-foreground">
                Las solicitudes destacadas aparecerán aquí pronto.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          {activeTab === 'properties' ? (
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/properties">
                <StaticText id="landing:view-all-properties" textType="span">
                  Ver Todas las Propiedades
                </StaticText>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/requests">
                <StaticText id="landing:view-all-requests" textType="span">
                  Ver Todas las Solicitudes
                </StaticText>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedPropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <div className="group bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-48 overflow-hidden bg-muted">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Home className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={property.listingType === 'rent' ? 'secondary' : 'default'} className="capitalize">
              {property.listingType === 'rent' ? 'Arriendo' : 'Venta'}
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground/70" />
              <span className="line-clamp-1">{property.location?.city || 'Ubicación no especificada'}</span>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-xl font-semibold text-primary">
              $ {property.price?.toLocaleString('es-CL')}
              {property.listingType === 'rent' && <span className="text-sm text-muted-foreground ml-1">/mes</span>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{property.description}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              {property.bedrooms !== undefined && (
                <div className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-1.5" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1.5" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.squareMeters !== undefined && (
                <div className="flex items-center">
                  <Maximize2 className="h-4 w-4 mr-1.5" />
                  <span>{property.squareMeters} m²</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>
                  {property.user?.name?.substring(0, 2).toUpperCase() || 'AK'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedRequestCard({ request }: { request: PropertyRequest }) {
  return (
    <Link href={`/requests/${request.id}`}>
      <div className="group bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start mb-3">
            <Badge variant="outline" className="capitalize">
              {request.listingType === 'rent' ? 'Arriendo' : 'Venta'}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground/70" />
              <span className="line-clamp-1">{request.location?.city || 'Ubicación no especificada'}</span>
            </div>
          </div>
          <h3 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {request.title}
          </h3>
          <div className="mb-4">
            <div className="text-xl font-semibold text-primary">
              $ {request.budget?.toLocaleString('es-CL')}
              {request.listingType === 'rent' && <span className="text-sm text-muted-foreground ml-1">/mes</span>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{request.description}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-3">
              {request.bedrooms !== undefined && (
                <div className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-1.5" />
                  <span>{request.bedrooms}</span>
                </div>
              )}
              {request.bathrooms !== undefined && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1.5" />
                  <span>{request.bathrooms}</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>
                  {request.user?.name?.substring(0, 2).toUpperCase() || 'AK'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
