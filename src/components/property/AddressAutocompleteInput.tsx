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
  const [inputValue, setInputValue] = useState(value); // Estado local para el input
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // Control explícito de visibilidad

  // Sincronizar inputValue con el value externo si cambia (ej. al resetear el formulario)
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // No incluir inputValue aquí para evitar bucles si onChange actualiza value inmediatamente

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false); // Ocultar si la query es muy corta
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=cl&limit=5&addressdetails=1`
      );
      if (!response.ok) {
        throw new Error('Error al obtener sugerencias de Nominatim');
      }
      const data: NominatimSuggestion[] = await response.json();
      setSuggestions(data);
      // Mantener las sugerencias visibles si estamos cargando y ya había algunas,
      // o si hemos recibido nuevas sugerencias.
      setShowSuggestions(data.length > 0 || (isLoading && suggestions.length > 0));
    } catch (error) {
      console.error("Error fetching Nominatim suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, suggestions.length]); // dependencias para useCallback

  // Debounce para la función fetchSuggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 3) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchSuggestions]); // Depender de inputValue para activar el debounce

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue); // Actualizar estado local del input
    onChange(newInputValue); // Propagar cambio al formulario principal para mantenerlo sincronizado
    if (newInputValue.length >= 3) {
      // fetchSuggestions se disparará por el useEffect que depende de inputValue
       setShowSuggestions(true); // Asegurarse de que el panel sea visible
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    const fullAddress = suggestion.display_name;
    setInputValue(fullAddress); // Actualizar el input visualmente
    setSuggestions([]); // Limpiar sugerencias
    setShowSuggestions(false); // Ocultar panel

    const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.county || '';
    const country = suggestion.address?.country || '';
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    // Llamar al onChange del formulario principal con la dirección completa y detalles
    onChange(fullAddress, { city, country, lat, lng });
  };

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue} // Usar inputValue para el input visual
          onChange={handleInputChange}
          onFocus={() => { 
            if (inputValue.length >=3 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          // onBlur es manejado por el div overlay de abajo para cerrar el CommandList
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off" // Desactivar autocompletado del navegador
        />
        {isLoading && inputValue.length >=3 && ( // Mostrar loader solo si se está buscando activamente
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || (isLoading && inputValue.length >=3) ) && (
        <CommandList className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto">
          {isLoading && suggestions.length === 0 && inputValue.length >=3 ? ( 
            <div className="p-2 text-center text-sm text-muted-foreground">
              <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
              Buscando direcciones...
            </div>
          ) : !isLoading && suggestions.length === 0 && inputValue.length >=3 ? ( 
            <CommandEmpty>No se encontraron resultados para "{inputValue}" en Chile.</CommandEmpty>
          ) : (
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.place_id}
                  value={suggestion.display_name} 
                  onSelect={() => handleSelectSuggestion(suggestion)}
                  className="cursor-pointer flex items-start gap-2 text-sm"
                >
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{suggestion.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      )}
      {/* Div para cerrar el dropdown si se hace clic afuera */}
      {showSuggestions && (suggestions.length > 0 || (isLoading && inputValue.length >=3)) && (
        <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSuggestions(false)}
            aria-hidden="true"
        />
      )}
    </Command>
  );
}
