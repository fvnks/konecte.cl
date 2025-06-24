// src/components/landing/HeroSearchForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Tag, Building, Home, FileText } from 'lucide-react';
import type { PropertyType, ListingCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

// Opciones para los dropdowns
const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'sale', label: 'Venta' },
  { value: 'rent', label: 'Arriendo' },
];

const categoryOptions: { value: ListingCategory; label: string }[] = [
  { value: 'apartment', label: 'Departamentos' },
  { value: 'house', label: 'Casas' },
  { value: 'condo', 'label': 'Condominios' },
  { value: 'land', label: 'Terrenos' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Otro' },
];

export default function HeroSearchForm() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<'properties' | 'requests'>('properties');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [category, setCategory] = useState<ListingCategory | ''>('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (propertyType) queryParams.set('propertyType', propertyType);
    if (category) queryParams.set('category', category);
    
    if (city.trim()) {
      queryParams.set('searchTerm', city.trim());
    }

    const searchUrl = `/${searchMode}?${queryParams.toString()}`;
    router.push(searchUrl);
  };

  return (
    <div className="p-2 bg-card/60 backdrop-blur-lg border rounded-2xl max-w-4xl mx-auto shadow-2xl">
      {/* Segmented Control */}
      <div className="flex items-center justify-center p-1 bg-muted rounded-xl">
        <button
          onClick={() => setSearchMode('properties')}
          className={cn(
            "w-full text-center px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
            searchMode === 'properties' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <Home className="h-5 w-5" />
          Buscar Propiedades
        </button>
        <button
          onClick={() => setSearchMode('requests')}
          className={cn(
            "w-full text-center px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
            searchMode === 'requests' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <FileText className="h-5 w-5" />
          Buscar Solicitudes
        </button>
      </div>

      {/* Unified Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="mt-2 flex flex-col md:flex-row items-center gap-0.5 p-2 bg-background/50 rounded-xl"
      >
        <div className="flex w-full md:w-auto items-center border-r-0 md:border-r border-border">
          <Select
            value={propertyType}
            onValueChange={(value) => setPropertyType(value as PropertyType)}
          >
            <SelectTrigger className="h-14 text-sm w-full md:w-[130px] bg-transparent border-0 rounded-l-lg focus:ring-0">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {propertyTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ListingCategory)}
          >
            <SelectTrigger className="h-14 text-sm w-full md:w-[150px] bg-transparent border-0 rounded-r-lg md:rounded-r-none focus:ring-0">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Categoría" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Ingresa comuna o ciudad..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-14 text-base pl-12 bg-transparent border-0 w-full focus:ring-0"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-14 text-base font-bold w-full md:w-auto rounded-xl md:rounded-l-none"
        >
          Buscar
        </Button>
      </form>
    </div>
  );
}
