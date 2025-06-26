// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, FileSearch, ArrowRight, Loader2, Home, MapPin, BedDouble, Bath, Maximize2, Search, Bot, ShieldCheck } from 'lucide-react';
import StaticText from '@/components/ui/StaticText';
import { getPropertiesCountAction } from '@/actions/propertyActions';
import { getRequestsCountAction } from '@/actions/requestActions';

// Definir las interfaces para los tipos
interface Property {
  id: string;
  pub_id?: string;
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
  author?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
    role_id?: string;
    role_name?: string;
  };
  createdAt?: string;
  source?: 'bot' | 'web' | 'app';
  slug?: string;
  city?: string;
}

interface PropertyRequest {
  id: string;
  pub_id?: string;
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
  author?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
    role_id?: string;
    role_name?: string;
  };
  createdAt?: string;
  source?: 'bot' | 'web' | 'app';
  slug?: string;
  city?: string;
}

// Función para generar un slug a partir del título
function generateSlug(title: string, id: string): string {
  if (!title) return id;
  return `${title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-')
    .substring(0, 60)}-${id}`;
}

// Función para obtener el nombre del rol
function getRoleDisplayName(role_id?: string, role_name?: string): string | null {
  if (role_name) return role_name;
  if (role_id === '1') return 'Usuario';
  if (role_id === '2') return 'Corredor';
  if (role_id === '3') return 'Administrador';
  return role_id || null;
}

export default function FeaturedListingsClient({ featuredProperties: initialProperties, recentRequests: initialRequests }: { featuredProperties: Property[], recentRequests: PropertyRequest[] }) {
  const [activeTab, setActiveTab] = useState<'properties' | 'requests'>('properties');
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [requests, setRequests] = useState<PropertyRequest[]>(initialRequests);
  const [propertyCount, setPropertyCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [
          totalProperties,
          totalRequests
        ] = await Promise.all([
          getPropertiesCountAction(true),
          getRequestsCountAction(true)
        ]);
        setPropertyCount(totalProperties);
        setRequestCount(totalRequests);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setPropertyCount(0);
        setRequestCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Si tenemos datos iniciales, solo buscamos los contadores
    if (initialProperties.length > 0 || initialRequests.length > 0) {
        fetchCounts();
    } else {
        // Si no, podríamos buscar todo (aunque la página principal ya lo hace)
        setIsLoading(false);
    }
  }, [initialProperties, initialRequests]);

  const displayedProperties = isMobile ? properties.slice(0, 4) : properties;
  const displayedRequests = isMobile ? requests.slice(0, 4) : requests;

  return (
    <section className="py-6">
      <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Propiedades y Solicitudes Destacadas</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">Explora las últimas propiedades y solicitudes agregadas a nuestra plataforma.</p>
      </div>
      <div className="bg-slate-200 rounded-xl p-4 sm:p-6 md:p-8 mt-0">
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-full max-w-md sm:max-w-3xl grid grid-cols-2 gap-2 sm:gap-4">
            <button
              className={`px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-base font-medium transition-all rounded-lg shadow-sm ${
                activeTab === 'properties' 
                  ? 'bg-primary text-white shadow-md transform scale-105' 
                  : 'bg-white hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('properties')}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <Building className="h-5 w-5" />
                <span className="truncate">
                  Propiedades
                </span>
                <span className={`ml-1 ${activeTab === 'properties' ? 'bg-white/20' : 'bg-primary/10'} px-2 py-0.5 rounded-full text-xs`}>
                  {propertyCount}
                </span>
              </div>
            </button>
            <button
              className={`px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-base font-medium transition-all rounded-lg shadow-sm ${
                activeTab === 'requests' 
                  ? 'bg-primary text-white shadow-md transform scale-105' 
                  : 'bg-white hover:bg-primary/10'
              }`}
              onClick={() => setActiveTab('requests')}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <FileSearch className="h-5 w-5" />
                <span className="truncate">
                  Solicitudes
                </span>
                <span className={`ml-1 ${activeTab === 'requests' ? 'bg-white/20' : 'bg-primary/10'} px-2 py-0.5 rounded-full text-xs`}>
                  {requestCount}
                </span>
              </div>
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
              {displayedProperties.map((property) => (
                <FeaturedPropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
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
            {displayedRequests.map((request) => (
              <FeaturedRequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
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

        <div className="flex justify-center gap-4 mt-8">
          <Button asChild variant="outline" size="lg" className="rounded-full bg-white hover:bg-white/90">
            <Link href={activeTab === 'properties' ? "/properties" : "/requests"}>
              <StaticText id={activeTab === 'properties' ? "landing:view-all-properties" : "landing:view-all-requests"} textType="span">
                {activeTab === 'properties' ? "Ver Todas las Propiedades" : "Ver Todas las Solicitudes"}
              </StaticText>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturedPropertyCard({ property }: { property: Property }) {
  const propertySlug = property.slug || generateSlug(property.title, property.id);
  const authorName = property.author?.name || "Anunciante";
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const authorRoleDisplay = getRoleDisplayName(property.author?.role_id, property.author?.role_name);

  return (
    <Link href={`/properties/${propertySlug}`} className="block group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 flex flex-col">
        <div className="relative w-full h-48 bg-gray-200">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={`Imagen de ${property.title}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Home className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {property.listingType && (
              <Badge variant="secondary" className="capitalize">{property.listingType === 'rent' ? 'Arriendo' : 'Venta'}</Badge>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {property.pub_id && <Badge variant="default">{property.pub_id}</Badge>}
          </div>
          {property.source === 'bot' && (
             <div className="absolute bottom-2 right-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                  <Bot className="h-4 w-4 mr-1.5 text-blue-600"/>
                  WhatsApp
                </Badge>
              </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <p className="text-sm text-gray-500 mb-1 flex items-center">
            <MapPin className="h-4 w-4 mr-1.5" />
            {property.city || 'Ubicación no disponible'}
          </p>
          <h3 className="font-semibold text-lg text-gray-800 group-hover:text-primary transition-colors truncate mb-2">
            {property.title}
          </h3>
          <div className="text-xl font-bold text-primary mb-3">
            {property.price ? `$ ${property.price.toLocaleString('es-CL')}` : 'Precio no disponible'}
            {property.listingType === 'rent' && <span className="text-sm font-normal text-gray-500">/mes</span>}
          </div>
          <div className="flex-grow" />
          <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3 mt-3">
             {property.bedrooms !== null && 
                <span className="inline-flex items-center"><BedDouble className="h-4 w-4 mr-1.5 text-gray-500" /> {property.bedrooms}</span>
             }
             {property.bathrooms !== null && 
                <span className="inline-flex items-center"><Bath className="h-4 w-4 mr-1.5 text-gray-500" /> {property.bathrooms}</span>
             }
             {property.squareMeters !== null && 
                <span className="inline-flex items-center"><Maximize2 className="h-4 w-4 mr-1.5 text-gray-500" /> {property.squareMeters} m²</span>
             }
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={property.author?.avatarUrl} alt={authorName} />
                    <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{authorName}</p>
                    {authorRoleDisplay && <p className="text-xs text-gray-500 truncate">{authorRoleDisplay}</p>}
                </div>
            </div>
            {property.author?.role_id === '2' && <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />}
        </div>
      </div>
    </Link>
  );
}

function FeaturedRequestCard({ request }: { request: PropertyRequest }) {
  const requestSlug = request.slug || generateSlug(request.title, request.id);
  const authorName = request.author?.name || "Usuario";
  const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const authorRoleDisplay = getRoleDisplayName(request.author?.role_id, request.author?.role_name);
  
  return (
    <Link href={`/requests/${requestSlug}`} className="block group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 flex flex-col">
        <div className="p-4 flex-grow">
           <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  {request.city || 'Ubicación no especificada'}
                </p>
                <h3 className="font-semibold text-lg text-gray-800 group-hover:text-primary transition-colors">
                  {request.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                {request.listingType && (
                    <Badge variant="secondary" className="capitalize">{request.listingType === 'rent' ? 'Busca Arriendo' : 'Busca Compra'}</Badge>
                )}
                {request.pub_id && <Badge variant="default">{request.pub_id}</Badge>}
              </div>
            </div>

            {request.budget ? (
                <div className="text-lg font-bold text-primary mb-3">
                    Presupuesto: ${request.budget.toLocaleString('es-CL')}
                </div>
            ) : null}

            {request.description && <p className="text-sm text-gray-600 mt-2 mb-3 line-clamp-2">{request.description}</p>}

            <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3 mt-auto">
              {request.bedrooms && 
                  <span className="inline-flex items-center"><BedDouble className="h-4 w-4 mr-1.5 text-gray-500" /> {request.bedrooms}+</span>
              }
              {request.bathrooms && 
                  <span className="inline-flex items-center"><Bath className="h-4 w-4 mr-1.5 text-gray-500" /> {request.bathrooms}+</span>
              }
            </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={request.author?.avatarUrl} alt={authorName} />
                <AvatarFallback>{authorInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{authorName}</p>
                 {authorRoleDisplay && <p className="text-xs text-gray-500 truncate">{authorRoleDisplay}</p>}
              </div>
            </div>
            {request.source === 'bot' && (
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm flex-shrink-0">
                <Bot className="h-4 w-4 mr-1.5 text-blue-600"/>
                WhatsApp
              </Badge>
            )}
        </div>
      </div>
    </Link>
  );
}
