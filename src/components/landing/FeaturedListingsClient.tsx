// src/components/landing/FeaturedListingsClient.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, FileSearch, ArrowRight, Loader2, Home, MapPin, BedDouble, Bath, Maximize2, Search, Bot, ShieldCheck } from 'lucide-react';

// Definir las interfaces para los tipos
interface Author {
  id?: string;
  name?: string;
  avatarUrl?: string;
  role_id?: string;
  role_name?: string;
  group_name?: string; 
  group_avatar_url?: string;
  group_badge_type?: 'logo' | 'name' | 'none';
}

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
  author?: Author;
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
  author?: Author;
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

export default function FeaturedListingsClient({ 
  featuredProperties: initialProperties, 
  recentRequests: initialRequests,
  propertyCount,
  requestCount,
  noPropertiesMessage,
  noRequestsMessage,
  viewAllPropertiesText,
  viewAllRequestsText,
}: { 
  featuredProperties: Property[], 
  recentRequests: PropertyRequest[],
  propertyCount: number,
  requestCount: number,
  noPropertiesMessage: ReactNode,
  noRequestsMessage: ReactNode,
  viewAllPropertiesText: ReactNode,
  viewAllRequestsText: ReactNode,
}) {
  const [activeTab, setActiveTab] = useState<'properties' | 'requests'>('properties');
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [requests, setRequests] = useState<PropertyRequest[]>(initialRequests);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const displayedProperties = isMobile ? properties.slice(0, 4) : properties;
  const displayedRequests = isMobile ? requests.slice(0, 4) : requests;
  const isLoading = false; // Data is now pre-loaded

  return (
    <section className="py-6">
      <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Propiedades y Solicitudes</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">Explora las propiedades y solicitudes agregadas a nuestra plataforma.</p>
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
                {noPropertiesMessage}
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
              {noRequestsMessage}
            </h3>
            <p className="text-muted-foreground">
              Las solicitudes destacadas aparecerán aquí pronto.
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Button asChild variant="outline" size="lg" className="rounded-full bg-white hover:bg-white/90">
            <Link href={activeTab === 'properties' ? "/properties" : "/requests"}>
              {activeTab === 'properties' ? viewAllPropertiesText : viewAllRequestsText}
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
  const group = property.author;
  
  // Mantenemos el log para futura depuración si es necesario
  // console.log('FeaturedPropertyCard property:', property);

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
          
          <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
            {property.pub_id && (
              <Badge variant="secondary" className="bg-blue-500/80 text-white backdrop-blur-sm hover:bg-blue-600">
                {property.pub_id}
              </Badge>
            )}
          </div>

          <div className="absolute top-2 left-2 flex flex-col items-start gap-2">
            <Badge variant="default" className="capitalize">{property.listingType === 'rent' ? 'Arriendo' : 'Venta'}</Badge>
          </div>
          
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* CORRECCIÓN: Mostrar el badge si el nombre del grupo existe */}
            {group?.group_name && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 backdrop-blur-sm">
                {group.group_name}
              </Badge>
            )}
            
            {property.source === 'bot' && (
              <Badge variant="default" className="bg-green-600/90 text-white backdrop-blur-sm flex items-center gap-1.5 hover:bg-green-700">
                <Bot size={14} />
                WhatsApp
              </Badge>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors pr-2 flex-1">
                {property.title}
              </h3>
              <p className="font-semibold text-lg text-gray-900 whitespace-nowrap">
                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(property.price || 0)}
              </p>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>{property.city}, {property.location?.region}</span>
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center"><BedDouble className="h-4 w-4 mr-1.5 text-primary/80"/> {property.bedrooms} Dorm.</span>
              <span className="flex items-center"><Bath className="h-4 w-4 mr-1.5 text-primary/80"/> {property.bathrooms} Baños</span>
              {property.squareMeters && (
                <span className="flex items-center"><Maximize2 className="h-4 w-4 mr-1.5 text-primary/80"/> {property.squareMeters} m²</span>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={property.author?.avatarUrl} alt={authorName} />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-700">{authorName}</p>
              {authorRoleDisplay && <p className="text-xs text-gray-500">{authorRoleDisplay}</p>}
            </div>
          </div>
          {property.author?.role_id === 'broker' && (
            <ShieldCheck className="h-5 w-5 text-blue-500" title="Corredor verificado" />
          )}
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
  const group = request.author;

  return (
    <Link href={`/requests/${requestSlug}`} className="block group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 flex flex-col">
        <div className="relative w-full h-48 bg-gray-200 flex items-center justify-center">
            <FileSearch className="h-16 w-16 text-gray-400" />

            <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
              {request.pub_id && (
                <Badge variant="secondary" className="bg-blue-500/80 text-white backdrop-blur-sm hover:bg-blue-600">
                  {request.pub_id}
                </Badge>
              )}
            </div>

            <div className="absolute top-2 left-2 flex flex-col items-start gap-2">
                <Badge variant="default" className="capitalize">{request.listingType === 'rent' ? 'Busca Arriendo' : 'Busca Compra'}</Badge>
            </div>
            
            {/* Badges de grupo y WhatsApp en la esquina inferior derecha */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {group && group.group_name && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 backdrop-blur-sm">
                  {group.group_name}
                </Badge>
              )}
              
              {request.source === 'bot' && (
                <Badge variant="default" className="bg-green-600/90 text-white backdrop-blur-sm flex items-center gap-1.5 hover:bg-green-700">
                  <Bot size={14} />
                  WhatsApp
                </Badge>
              )}
            </div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">
              {request.title}
            </h3>
            
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span>{request.location?.city}, {request.location?.region}</span>
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                    Presupuesto: <span className="font-semibold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(request.budget || 0)}</span>
                </span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={request.author?.avatarUrl} alt={authorName} />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-700">{authorName}</p>
              {authorRoleDisplay && <p className="text-xs text-gray-500">{authorRoleDisplay}</p>}
            </div>
          </div>
          {request.author?.role_id === 'broker' && (
            <ShieldCheck className="h-5 w-5 text-blue-500" title="Corredor verificado" />
          )}
        </div>
      </div>
    </Link>
  );
}
