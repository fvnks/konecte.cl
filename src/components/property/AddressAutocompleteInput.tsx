
// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

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
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Sync inputValue with external value prop, but only if it's different.
    // This prevents resetting inputValue if onChange updates the parent state which then updates `value`.
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on external value prop

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setFetchError(null);
      setIsLoading(false); // Ensure loader is off if query becomes too short
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=cl&limit=5&addressdetails=1`
      );
      
      console.log(`Nominatim API request for: "${query}" - Status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorDataText = await response.text();
            console.error("Nominatim API error response text:", errorDataText);
            // Attempt to parse as JSON if possible, otherwise use text
            try {
                const errorData = JSON.parse(errorDataText);
                if (errorData && errorData.error && errorData.error.message) {
                    errorDetail += ` - ${errorData.error.message}`;
                } else if (errorData && errorData.error) {
                    errorDetail += ` - ${JSON.stringify(errorData.error)}`;
                } else {
                    errorDetail += ` - Respuesta: ${errorDataText.substring(0,100)}...`;
                }
            } catch (parseErr) {
                 errorDetail += ` - Respuesta (no JSON): ${errorDataText.substring(0,100)}...`;
            }
        } catch (e) {
            // Fallback if .text() fails, though unlikely for !response.ok
        }
        throw new Error(errorDetail);
      }
      const data = await response.json();
      console.log('Nominatim API response data:', data);

      if (Array.isArray(data)) {
        setSuggestions(data as NominatimSuggestion[]);
      } else {
        console.warn('Nominatim response was not an array as expected:', data);
        setSuggestions([]);
        // setFetchError("Respuesta inesperada del servicio de direcciones."); // Optionally set error
      }

      if (query.length >= 3) { // Only show suggestions if query is still valid
          setShowSuggestions(true);
      }

    } catch (error: any) {
      console.error("Error fetching/processing Nominatim suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(error.message || "No se pudieron cargar las sugerencias. Verifica tu conexión o inténtalo más tarde.");
      if (query.length >=3) { // Show error message in dropdown if applicable
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
        setFetchError(null);
        setIsLoading(false); // Explicitly set loading to false here
      }
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fetchSuggestions]); // Removed isLoading from here

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Propagate change up immediately for uncontrolled behavior if needed
    if (newInputValue.length >= 3) {
      setFetchError(null); // Clear previous errors when user types more
      // setShowSuggestions(true); // Let useEffect handle showing suggestions via fetch
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
          // onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow click on suggestions
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
            <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive">
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
            <CommandEmpty className="py-3 px-2.5 text-center text-sm">No se encontraron resultados para "{inputValue}" en Chile.</CommandEmpty>
          )}
        </CommandList>
      )}
      {showSuggestions && inputValue.length >=3 && (
        <div
            className="fixed inset-0 z-40" // Lower z-index than CommandList
            onClick={() => setShowSuggestions(false)}
            aria-hidden="true"
        />
      )}
    </Command>
  );
}

    