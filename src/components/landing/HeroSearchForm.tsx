// src/components/landing/HeroSearchForm.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Search, Tag, Building, Home, FileText, Fingerprint, Loader2 } from 'lucide-react';
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
  const [hasMounted, setHasMounted] = useState(false);
  const [searchMode, setSearchMode] = useState<'properties' | 'requests' | 'code'>('properties');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [category, setCategory] = useState<ListingCategory | ''>('');
  const [city, setCity] = useState('');
  const [publicationCode, setPublicationCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (propertyType) queryParams.set('propertyType', propertyType);
    if (category) queryParams.set('category', category);
    
    if (city.trim()) {
      queryParams.set('searchTerm', city.trim());
    }

    const searchUrl = `/${searchMode === 'properties' ? 'properties' : 'requests'}?${queryParams.toString()}`;
    router.push(searchUrl);
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!publicationCode.trim() || isLoadingCode) return;

    setIsLoadingCode(true);
    setErrorCode(null);

    const code = publicationCode.trim().toUpperCase();
    const entityType = code.startsWith('P-') ? 'properties' : code.startsWith('S-') ? 'requests' : null;

    if (!entityType) {
      setErrorCode('El formato del código no es reconocido (ej: P-XXXXXX).');
      setIsLoadingCode(false);
      return;
    }

    try {
      const response = await fetch(`/api/${entityType}/code/${code}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          router.push(`/${entityType}/${data.slug}`);
        } else {
          setErrorCode('Publicación encontrada, pero no se pudo redirigir.');
          setIsLoadingCode(false);
        }
      } else if (response.status === 404) {
        setErrorCode('No se encontró ninguna publicación con ese código.');
        setIsLoadingCode(false);
    } else {
        setErrorCode('Ocurrió un error en el servidor. Inténtalo de nuevo.');
        setIsLoadingCode(false);
      }
    } catch (error) {
      console.error('Error al buscar por código:', error);
      setErrorCode('Error de red. Verifica tu conexión e inténtalo de nuevo.');
      setIsLoadingCode(false);
    }
  };

  if (!hasMounted) {
    return (
      <div className="p-2 bg-card/60 backdrop-blur-lg border rounded-2xl max-w-4xl mx-auto shadow-2xl">
        <div className="h-[128px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-card/60 backdrop-blur-lg border rounded-2xl max-w-4xl mx-auto shadow-2xl">
      {/* Segmented Control */}
      <div className="flex flex-col sm:flex-row items-center justify-center p-1 bg-muted rounded-xl gap-1">
        <button
          onClick={() => setSearchMode('properties')}
          className={cn(
            "w-full text-center px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
            searchMode === 'properties' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="sm:hidden">Propiedades</span>
          <span className="hidden sm:inline">Buscar Propiedades</span>
        </button>
        <button
          onClick={() => setSearchMode('requests')}
          className={cn(
            "w-full text-center px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
            searchMode === 'requests' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <FileText className="h-5 w-5" />
          <span className="sm:hidden">Solicitudes</span>
          <span className="hidden sm:inline">Buscar Solicitudes</span>
        </button>
        <button
          onClick={() => setSearchMode('code')}
          className={cn(
            "w-full text-center px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 flex items-center justify-center gap-2",
            searchMode === 'code' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background/50'
          )}
        >
          <Fingerprint className="h-5 w-5" />
          <span className="sm:hidden">Por Código</span>
          <span className="hidden sm:inline">Buscar por Código</span>
        </button>
      </div>

      <div className="mt-2">
      {searchMode === 'code' ? (
        <form
          onSubmit={handleCodeSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-background/50 rounded-xl"
        >
          <div className="relative w-full flex-grow">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Ingresa el código de publicación (ej: P-A1B2C3)"
              value={publicationCode}
                onChange={(e) => {
                  setPublicationCode(e.target.value);
                  if (errorCode) setErrorCode(null);
                }}
              className="h-14 text-base pl-12 bg-transparent border-0 w-full focus:ring-0"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 text-base font-bold w-full md:w-auto rounded-xl"
              disabled={isLoadingCode}
          >
              {isLoadingCode ? <Loader2 className="h-6 w-6 animate-spin" /> : "Buscar"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-background/50 rounded-xl"
        >
            <div className="flex flex-col sm:flex-row flex-grow items-center gap-0.5">
              <div className="flex w-full sm:w-auto items-center border-r-0 md:border-r border-border">
            <Select
              value={propertyType}
              onValueChange={(value) => setPropertyType(value as PropertyType)}
            >
                  <SelectTrigger className="h-14 text-sm w-full sm:w-[130px] bg-transparent border-0 rounded-l-lg focus:ring-0">
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
                  <SelectTrigger className="h-14 text-sm w-full sm:w-[150px] bg-transparent border-0 rounded-r-lg sm:rounded-r-none focus:ring-0">
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
            </div>
          <Button
            type="submit"
            size="lg"
              className="h-14 text-base font-bold w-full md:w-auto rounded-xl"
          >
            Buscar
          </Button>
        </form>
      )}
        {errorCode && <p className="text-destructive text-sm mt-2 text-center font-medium">{errorCode}</p>}
      </div>
    </div>
  );
}
