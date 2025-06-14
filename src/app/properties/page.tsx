
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

  // Estado para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState<PropertyType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ListingCategory | 'all'>('all');
  const [filterCity, setFilterCity] = useState('');
  const [orderBy, setOrderBy] = useState<GetPropertiesActionOptions['orderBy']>('createdAt_desc');

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: GetPropertiesActionOptions = {
        searchTerm: searchTerm || undefined,
        propertyType: filterPropertyType === 'all' ? undefined : filterPropertyType,
        category: filterCategory === 'all' ? undefined : filterCategory,
        city: filterCity || undefined,
        orderBy: orderBy,
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
  }, [searchTerm, filterPropertyType, filterCategory, filterCity, orderBy, toast]);

  useEffect(() => {
    // Carga inicial
    fetchProperties();
  }, []); // Solo se ejecuta al montar inicialmente

  const handleApplyFilters = () => {
    // No es necesario un useTransition aquí si fetchProperties ya maneja setIsLoading
    // startTransition(() => { // Comentado o eliminado si no es necesario
    fetchProperties();
    // });
  };
  
  const handleFilterChange = () => {
    startTransition(() => {
      fetchProperties();
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterPropertyType('all');
    setFilterCategory('all');
    setFilterCity('');
    setOrderBy('createdAt_desc');
    // La llamada a fetchProperties se activará por el useEffect que depende de estas variables de estado
    // o podemos llamarla explícitamente si queremos asegurar el re-fetch inmediato tras el reset.
    startTransition(() => {
      fetchProperties(); // Re-ejecutar con los filtros reseteados
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

      <Card className="shadow-lg rounded-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="search-term" className="block text-sm font-medium text-muted-foreground mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-term"
                  type="search"
                  placeholder="Título, descripción, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="property-type" className="block text-sm font-medium text-muted-foreground mb-1">Tipo Transacción</label>
              <Select value={filterPropertyType} onValueChange={(value) => setFilterPropertyType(value as PropertyType | 'all')}>
                <SelectTrigger id="property-type">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1">Categoría</label>
              <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as ListingCategory | 'all')}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-muted-foreground mb-1">Ciudad/Comuna</label>
              <Input
                id="city"
                placeholder="Ej: Valparaíso"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4 border-t">
             <div>
                <label htmlFor="order-by" className="block text-sm font-medium text-muted-foreground mb-1">Ordenar Por</label>
                <Select value={orderBy} onValueChange={(value) => setOrderBy(value as GetPropertiesActionOptions['orderBy'])}>
                    <SelectTrigger id="order-by" className="w-full sm:w-[220px]">
                    <ListFilter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                    {orderByOptions.map(opt => <SelectItem key={opt.value || 'default'} value={opt.value || 'createdAt_desc'}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleResetFilters} variant="outline" className="w-full sm:w-auto" disabled={isPending || isLoading}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
              </Button>
              <Button onClick={handleApplyFilters} className="w-full sm:w-auto" disabled={isPending || isLoading}>
                {isPending || isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Aplicar Filtros
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
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}

