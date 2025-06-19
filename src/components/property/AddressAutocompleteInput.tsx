
// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only re-sync if the external value prop changes

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setFetchError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null); // Clear previous errors before a new fetch

    // console.log(`[AddressAutocompleteInput] Fetching for: ${query}`);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=cl&limit=5&addressdetails=1`
      );
      
      // console.log(`[AddressAutocompleteInput] Nominatim API request for: "${query}" - Status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorDataText = await response.text();
            // console.error("[AddressAutocompleteInput] Nominatim API error response text:", errorDataText);
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
        } catch (e) { /* ignore if response text cannot be read */ }
        throw new Error(errorDetail);
      }
      const data = await response.json();
      // console.log('[AddressAutocompleteInput] Nominatim API response data:', data);

      if (Array.isArray(data)) {
        setSuggestions(data as NominatimSuggestion[]);
        setFetchError(null); // Clear any previous fetch error
      } else {
        // console.warn('[AddressAutocompleteInput] Nominatim response was not an array as expected:', data);
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones.");
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput] Error fetching/processing Nominatim suggestions:", error.message);
      setSuggestions([]);
      setFetchError(error.message.includes("Failed to fetch") 
        ? "Error de red. No se pudo conectar al servicio de direcciones." 
        : (error.message || "No se pudieron cargar las sugerencias."));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies are minimal and stable

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 3) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        if(isLoading){ setIsLoading(false); } // Stop loading if input becomes too short
        setFetchError(null);
      }
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchSuggestions, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Update form field immediately for control by RHF
    if (newInputValue.length >= 3) {
      setFetchError(null); // Clear error on new input
      setShowSuggestions(true); // Show suggestions when user starts typing valid query
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setFetchError(null);
      if(isLoading){ setIsLoading(false); }
    }
  };

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    const fullAddress = suggestion.display_name;
    setInputValue(fullAddress); // Update local input state
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

    const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.county || '';
    const country = suggestion.address?.country || '';
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    onChange(fullAddress, { city, country, lat, lng }); // Propagate to form
  };

  // console.log("[AddressAutocompleteInput RENDER] inputValue:", `"${inputValue}"`, "isLoading:", isLoading, "fetchError:", fetchError, "showSuggestions:", showSuggestions, "suggestions.length:", suggestions.length);

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.length >= 3) {
              setShowSuggestions(true);
              // If suggestions are empty and no error/loading, maybe re-fetch
              if (suggestions.length === 0 && !fetchError && !isLoading) {
                fetchSuggestions(inputValue);
              }
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {isLoading && inputValue.length >=3 && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {fetchError && inputValue.length >=3 && !isLoading && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {inputValue.length >= 3 && showSuggestions && (
        <>
          <CommandList
            ref={commandListRef}
            className={cn(
              "absolute z-[1001] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
            )}
          >
            {fetchError && !isLoading ? (
              <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive">
                  <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}
              </CommandEmpty>
            ) : isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
                <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                Buscando direcciones...
              </div>
            ) : suggestions.length > 0 ? (
              <CommandGroup heading={suggestions.length > 1 ? `${suggestions.length} sugerencias encontradas:` : `1 sugerencia encontrada:`} >
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
              <CommandEmpty className="py-3 px-2.5 text-center text-sm">
                  No se encontraron resultados para "{inputValue}" en Chile.
              </CommandEmpty>
            )}
          </CommandList>
          {/* Click outside detector */}
          <div
              className="fixed inset-0 z-[1000]" 
              onClick={() => {
                  setShowSuggestions(false);
              }}
              aria-hidden="true"
          />
        </>
      )}
    </Command>
  );
}

