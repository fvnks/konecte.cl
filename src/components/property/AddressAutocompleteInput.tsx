// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    country_code?: string;
    road?: string;
    house_number?: string;
    neighbourhood?: string;
  };
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, details?: { city?: string; country?: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  placeholder = 'Ingresa la dirección...',
  className,
  disabled = false,
}: AddressAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sincronizar el valor interno si el valor externo (del formulario) cambia
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) { // No buscar con menos de 3 caracteres
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    try {
      // Usamos el endpoint de búsqueda de Nominatim. Limitamos a Chile (cl).
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=cl&limit=5&addressdetails=1`
      );
      if (!response.ok) {
        throw new Error('Error al obtener sugerencias de Nominatim');
      }
      const data: NominatimSuggestion[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error("Error fetching Nominatim suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce para la función fetchSuggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue === value && inputValue.length >= 3) { // Solo busca si el valor interno coincide con el del form y tiene longitud
        fetchSuggestions(inputValue);
      } else if (inputValue.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, value, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Actualizar el valor del formulario principal inmediatamente
    if (newInputValue.length >= 3) {
      setShowSuggestions(true); // Mostrar el contenedor de sugerencias al empezar a escribir
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    const fullAddress = suggestion.display_name;
    setInputValue(fullAddress); // Actualiza el input visualmente
    setSuggestions([]);
    setShowSuggestions(false);

    const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.county || '';
    const country = suggestion.address?.country || '';
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    onChange(fullAddress, { city, country, lat, lng });
  };

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (inputValue.length >=3 && suggestions.length > 0) setShowSuggestions(true);}}
          // onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Retraso para permitir clic en sugerencia
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          aria-label="Dirección"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <CommandList className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          <CommandEmpty className={cn(isLoading ? "hidden" : "py-6 text-center text-sm")}>
            {isLoading ? "" : "No se encontraron resultados."}
          </CommandEmpty>
          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.place_id}
                value={suggestion.display_name} // Esto es lo que Command usa para filtrar si shouldFilter no es false
                onSelect={() => handleSelectSuggestion(suggestion)}
                className="cursor-pointer flex items-start gap-2 text-sm"
              >
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="flex-1">{suggestion.display_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
      {/* Para cerrar el dropdown si se hace clic afuera */}
      {showSuggestions && (
        <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSuggestions(false)}
        />
      )}
    </Command>
  );
}
