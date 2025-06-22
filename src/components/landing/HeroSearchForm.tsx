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
import { Search } from 'lucide-react';
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

    // Use selected values directly
    queryParams.set('propertyType', propertyType);
    queryParams.set('category', category);
    
    if (city.trim()) {
      queryParams.set('city', city.trim());
    }

    const searchUrl = `/properties?${queryParams.toString()}`;
    router.push(searchUrl);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex flex-col sm:flex-row items-center gap-2 p-3 bg-card/90 backdrop-blur-sm border rounded-xl max-w-3xl mx-auto shadow-lg"
    >
      <Select
        value={propertyType}
        onValueChange={(value) => setPropertyType(value as PropertyType)}
      >
        <SelectTrigger className="h-11 text-sm border-gray-300 focus:ring-primary w-full sm:w-auto sm:min-w-[120px]">
          <SelectValue />
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
        <SelectTrigger className="h-11 text-sm border-gray-300 focus:ring-primary w-full sm:w-auto sm:min-w-[150px]">
          <SelectValue />
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
          placeholder="Ingresa comuna o ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11 text-sm pl-4 pr-10 border-gray-300 focus:ring-primary"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 text-sm font-bold w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
      >
        Buscar
      </Button>
    </form>
  );
}
