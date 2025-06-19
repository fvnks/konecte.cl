// src/components/filters/PropertySidebarFilters.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PropertyType, ListingCategory } from '@/lib/types';
import { Home, Bath, Tag, Filter, Building as BuildingIcon, MapPin, DollarSign } from 'lucide-react';

interface PropertySidebarFiltersProps {
  minBedrooms: string;
  setMinBedrooms: (value: string) => void;
  minBathrooms: string;
  setMinBathrooms: (value: string) => void;
  
  filterPropertyType: PropertyType | 'all';
  setFilterPropertyType: (value: PropertyType | 'all') => void;
  propertyTypeOptions: { value: PropertyType | 'all'; label: string }[];
  
  filterCategory: ListingCategory | 'all';
  setFilterCategory: (value: ListingCategory | 'all') => void;
  categoryOptions: { value: ListingCategory | 'all'; label: string }[];
  
  filterCity: string;
  setFilterCity: (value: string) => void;

  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
}

export default function PropertySidebarFilters({
  minBedrooms,
  setMinBedrooms,
  minBathrooms,
  setMinBathrooms,
  filterPropertyType,
  setFilterPropertyType,
  propertyTypeOptions,
  filterCategory,
  setFilterCategory,
  categoryOptions,
  filterCity,
  setFilterCity,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}: PropertySidebarFiltersProps) {
  return (
    <Card className="shadow-lg rounded-xl sticky top-24">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Filter className="h-5 w-5 mr-2 text-primary" />
          Filtrar Propiedades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        <div>
          <Label htmlFor="filter-city" className="text-sm font-medium mb-1.5 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            Ciudad/Comuna
          </Label>
          <Input
            id="filter-city"
            placeholder="Ej: Santiago, Las Condes"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="filter-property-type" className="text-sm font-medium mb-1.5 flex items-center">
            <Tag className="h-4 w-4 mr-2 text-primary" />
            Tipo de Transacción
          </Label>
          <Select value={filterPropertyType} onValueChange={setFilterPropertyType}>
            <SelectTrigger id="filter-property-type" className="h-9 text-sm w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-category" className="text-sm font-medium mb-1.5 flex items-center">
            <BuildingIcon className="h-4 w-4 mr-2 text-primary" />
            Categoría de Propiedad
          </Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="filter-category" className="h-9 text-sm w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* Precio Min y Max */}
          <div>
            <Label htmlFor="min-price" className="text-sm font-medium mb-1.5 flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-primary" />
              Precio Mín.
            </Label>
            <Input
              id="min-price"
              type="number"
              min="0"
              placeholder="Ej: 5000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-sm w-full"
            />
          </div>
          <div>
            <Label htmlFor="max-price" className="text-sm font-medium mb-1.5 flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-primary" />
              Precio Máx.
            </Label>
            <Input
              id="max-price"
              type="number"
              min="0"
              placeholder="Ej: 10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 text-sm w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* Dorms y Baños */}
          <div>
            <Label htmlFor="min-bedrooms" className="text-sm font-medium mb-1.5 flex items-center">
              <Home className="h-4 w-4 mr-1 text-primary" />
              Dorms (mín.)
            </Label>
            <Input
              id="min-bedrooms"
              type="number"
              min="0"
              placeholder="Ej: 2"
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
              className="h-9 text-sm w-full"
            />
          </div>
          <div>
            <Label htmlFor="min-bathrooms" className="text-sm font-medium mb-1.5 flex items-center">
              <Bath className="h-4 w-4 mr-1 text-primary" />
              Baños (mín.)
            </Label>
            <Input
              id="min-bathrooms"
              type="number"
              min="0"
              placeholder="Ej: 1"
              value={minBathrooms}
              onChange={(e) => setMinBathrooms(e.target.value)}
              className="h-9 text-sm w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
