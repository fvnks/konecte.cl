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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Search, Tag, Building, Home, FileText } from 'lucide-react';
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
    <div className="p-4 bg-card/80 backdrop-blur-sm border rounded-xl max-w-4xl mx-auto shadow-lg">
      <RadioGroup
        defaultValue="properties"
        onValueChange={(value: 'properties' | 'requests') => setSearchMode(value)}
        className="flex items-center space-x-4 mb-4 justify-center"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="properties" id="r-properties" />
          <Label htmlFor="r-properties" className="flex items-center gap-2 text-base cursor-pointer">
            <Home className="h-5 w-5 text-primary" />
            Buscar Propiedades
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="requests" id="r-requests" />
          <Label htmlFor="r-requests" className="flex items-center gap-2 text-base cursor-pointer">
            <FileText className="h-5 w-5 text-primary" />
            Buscar Solicitudes
          </Label>
        </div>
      </RadioGroup>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-background/50 border-t"
      >
        <Select
          value={propertyType}
          onValueChange={(value) => setPropertyType(value as PropertyType)}
        >
          <SelectTrigger className="h-12 text-sm w-full sm:w-auto sm:min-w-[120px]">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary/80" />
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
          <SelectTrigger className="h-12 text-sm w-full sm:w-auto sm:min-w-[150px]">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary/80" />
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
    </div>
  );
}
