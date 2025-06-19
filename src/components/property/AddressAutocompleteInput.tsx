// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

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
  const [fetchError, setFetchError] = useState<string | null>(null); // State for fetch errors

  useEffect(() => {
    // Only update inputValue if the external value prop changes and is different.
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on the external value

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setFetchError(null); // Clear previous errors
      return;
    }
    setIsLoading(true);
    setFetchError(null); // Clear previous errors before new fetch
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=cl&limit=5&addressdetails=1`
      );
      if (!response.ok) {
        // Try to get more info from the response if it's not ok
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error && errorData.error.message) {
                errorDetail += ` - ${errorData.error.message}`;
            } else if (errorData && errorData.error) {
                errorDetail += ` - ${JSON.stringify(errorData.error)}`;
            }
        } catch (e) {
            // Ignore if response is not JSON or if response.json() itself fails
            console.warn("Could not parse error response from Nominatim as JSON.");
        }
        console.error("Nominatim API error:", errorDetail);
        throw new Error(`Error al obtener sugerencias (${response.status})`);
      }
      const data: NominatimSuggestion[] = await response.json();
      setSuggestions(data);
      if (query.length >= 3) { // Ensure query is still relevant
          setShowSuggestions(true);
      }
    } catch (error: any) {
      // This catch block will handle network errors ("Failed to fetch") 
      // or the error thrown above if response.ok is false.
      console.error("Error fetching/processing Nominatim suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(error.message || "No se pudieron cargar las sugerencias. Verifica tu conexión o inténtalo más tarde.");
      // Keep suggestions panel open to show the error message via CommandEmpty
      if (query.length >=3) {
          setShowSuggestions(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 3) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false); // Reset isLoading if input becomes too short
        setFetchError(null); // Clear any errors if input is too short
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Update form immediately with typed value
    if (newInputValue.length >= 3) {
      setShowSuggestions(true); // Show suggestions panel when user starts typing
      setFetchError(null); // Clear previous errors on new input
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setFetchError(null);
    }
  };

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    const fullAddress = suggestion.display_name;
    setInputValue(fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

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
          onFocus={() => {
            if (inputValue.length >= 3 && (suggestions.length > 0 || isLoading || fetchError)) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {isLoading && inputValue.length >=3 && !fetchError && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {fetchError && inputValue.length >=3 && !isLoading && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {showSuggestions && inputValue.length >=3 && (
        <CommandList className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
              Buscando direcciones...
            </div>
          ) : fetchError ? (
            <CommandEmpty className="py-3 px-2 text-center text-sm text-destructive">
                <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}
            </CommandEmpty>
          ) : suggestions.length > 0 ? (
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.place_id}
                  value={suggestion.display_name}
                  onSelect={() => handleSelectSuggestion(suggestion)}
                  className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{suggestion.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            // Este mensaje se muestra si fetch fue exitoso pero no devolvió sugerencias
            <CommandEmpty className="py-3 px-2 text-center text-sm">No se encontraron resultados para "{inputValue}" en Chile.</CommandEmpty>
          )}
        </CommandList>
      )}
      {showSuggestions && inputValue.length >=3 && (
        <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSuggestions(false)}
            aria-hidden="true"
        />
      )}
    </Command>
  );
}
