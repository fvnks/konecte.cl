
// src/app/properties/page.tsx
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import PropertyListItem from "@/components/property/PropertyListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, ListFilter, Search, Building, Loader2, RotateCcw } from "lucide-react";
import { getPropertiesAction, type GetPropertiesActionOptions } from "@/actions/propertyActions";
import type { PropertyListing, PropertyType, ListingCategory } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import PropertySidebarFilters from '@/components/filters/PropertySidebarFilters';

// Opciones para los Select que se pasarán al sidebar
const propertyTypeOptions: { value: PropertyType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los Tipos' },
  { value: 'rent', label: 'Arriendo' },
  { value: 'sale', label: 'Venta' },
];

const categoryOptions: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'condo', label: 'Condominio' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Otro' },
];

const orderByOptions: { value: GetPropertiesActionOptions['orderBy']; label: string }[] = [
  { value: 'createdAt_desc', label: 'Más Recientes' },
  { value: 'price_asc', label: 'Precio: Menor a Mayor' },
  { value: 'price_desc', label: 'Precio: Mayor a Menor' },
  { value: 'popularity_desc', label: 'Más Populares' },
];


export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Filtros superiores (búsqueda y orden)
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<GetPropertiesActionOptions['orderBy']>('createdAt_desc');

  // Filtros laterales
  const [filterPropertyType, setFilterPropertyType] = useState<PropertyType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ListingCategory | 'all'>('all');
  const [filterCity, setFilterCity] = useState('');
  const [minBedrooms, setMinBedrooms] = useState<string>(''); // Use string for input, parse to number in action
  const [minBathrooms, setMinBathrooms] = useState<string>(''); // Use string for input
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');


  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: GetPropertiesActionOptions = {
        searchTerm: searchTerm || undefined,
        propertyType: filterPropertyType === 'all' ? undefined : filterPropertyType,
        category: filterCategory === 'all' ? undefined : filterCategory,
        city: filterCity || undefined,
        orderBy: orderBy,
        minBedrooms: minBedrooms !== '' ? parseInt(minBedrooms, 10) : undefined,
        minBathrooms: minBathrooms !== '' ? parseInt(minBathrooms, 10) : undefined,
        minPrice: minPrice !== '' ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? parseFloat(maxPrice) : undefined,
      };
      const fetchedProperties = await getPropertiesAction(options);
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error al Cargar Propiedades",
        description: "No se pudieron obtener las propiedades. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterPropertyType, filterCategory, filterCity, orderBy, minBedrooms, minBathrooms, minPrice, maxPrice, toast]);

  useEffect(() => {
    // Check if URL contains searchTerm and apply it
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchTerm = urlParams.get('searchTerm');
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
      // Note: fetchProperties will be called by the dependency change of searchTerm if it's in the dep array of another useEffect
      // or you can call it directly here if this effect runs once on mount.
      // For simplicity, assume a main useEffect calls fetchProperties initially.
    }
    fetchProperties(); // Initial fetch or fetch based on URL params handled by useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this effect runs once on mount and cleanup.

  const handleApplyFilters = () => {
    startTransition(() => {
      fetchProperties();
    });
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setOrderBy('createdAt_desc');
    setFilterPropertyType('all');
    setFilterCategory('all');
    setFilterCity('');
    setMinBedrooms('');
    setMinBathrooms('');
    setMinPrice('');
    setMaxPrice('');
    // No need to startTransition here, as fetchProperties will be called by useEffect due to state changes
    // if fetchProperties is a dependency of such an effect.
    // However, to ensure immediate fetch on reset, explicitly call it within a transition.
    startTransition(() => {
      fetchProperties(); 
    });
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-card rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            Propiedades Disponibles
          </h1>
          <p className="text-muted-foreground mt-1">Explora todas las propiedades en arriendo o venta.</p>
        </div>
        <Button asChild size="lg" className="rounded-md shadow-sm hover:shadow-md transition-shadow">
          <Link href="/properties/submit">Publica Tu Propiedad</Link>
        </Button>
      </section>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <aside className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <PropertySidebarFilters
            minBedrooms={minBedrooms}
            setMinBedrooms={setMinBedrooms}
            minBathrooms={minBathrooms}
            setMinBathrooms={setMinBathrooms}
            filterPropertyType={filterPropertyType}
            setFilterPropertyType={setFilterPropertyType}
            propertyTypeOptions={propertyTypeOptions}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categoryOptions={categoryOptions}
            filterCity={filterCity}
            setFilterCity={setFilterCity}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />
        </aside>

        <div className="flex-1 space-y-6">
          <Card className="shadow-lg rounded-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5 text-primary" />
                Búsqueda y Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="search-term" className="block text-sm font-medium text-muted-foreground mb-1">Buscar por Palabra Clave</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-term"
                      type="search"
                      placeholder="Título, descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                 <div>
                    <label htmlFor="order-by" className="block text-sm font-medium text-muted-foreground mb-1">Ordenar Por</label>
                    <Select value={orderBy} onValueChange={(value) => setOrderBy(value as GetPropertiesActionOptions['orderBy'])}>
                        <SelectTrigger id="order-by" className="w-full">
                        <ListFilter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                        {orderByOptions.map(opt => <SelectItem key={opt.value || 'default'} value={opt.value || 'createdAt_desc'}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end items-end gap-4 pt-4 border-t">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleResetFilters} variant="outline" className="w-full sm:w-auto" disabled={isPending || isLoading}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar Filtros
                  </Button>
                  <Button onClick={handleApplyFilters} className="w-full sm:w-auto" disabled={isPending || isLoading}>
                    {isPending || isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Buscar Propiedades
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : properties.length > 0 ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">{properties.length} propiedad(es) encontrada(s).</p>
              {properties.map((property) => (
                <PropertyListItem key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No se Encontraron Propiedades</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Intenta ajustar tus filtros o revisa más tarde.
              </p>
              <Button className="mt-6" variant="outline" onClick={handleResetFilters} disabled={isPending || isLoading}>
                Limpiar Todos los Filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
