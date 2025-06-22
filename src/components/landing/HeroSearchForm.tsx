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
import { Search, Tag, Building } from 'lucide-react';
import type { PropertyType, ListingCategory } from '@/lib/types';

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
  const [propertyType, setPropertyType] = useState<PropertyType>('sale');
  const [category, setCategory] = useState<ListingCategory>('apartment');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    queryParams.set('propertyType', propertyType);
    queryParams.set('category', category);
    
    if (city.trim()) {
      // Use the generic 'searchTerm' to populate the properties page search bar
      queryParams.set('searchTerm', city.trim());
    }

    const searchUrl = `/properties?${queryParams.toString()}`;
    router.push(searchUrl);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 flex flex-col sm:flex-row items-center gap-2 p-3 bg-card/90 backdrop-blur-sm border rounded-xl max-w-3xl mx-auto shadow-lg"
    >
      <Select
        value={propertyType}
        onValueChange={(value) => setPropertyType(value as PropertyType)}
      >
        <SelectTrigger className="h-12 text-sm w-full sm:w-auto sm:min-w-[120px]">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary/80" />
            <SelectValue />
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
        <SelectTrigger className="h-12 text-sm w-full sm:w-auto sm:min-w-[150px]">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary/80" />
            <SelectValue />
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

      <div className="relative w-full flex-grow">
        <Input
          type="text"
          placeholder="Ingresa comuna o ciudad..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-12 text-sm pl-4"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 text-base font-bold w-full sm:w-auto flex items-center gap-2"
      >
        <Search className="h-5 w-5"/>
        Buscar
      </Button>
    </form>
  );
}
