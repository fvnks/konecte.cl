
// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

// Interface for Geoapify API response features
interface GeoapifyFeature {
  type: string;
  properties: {
    country: string;
    country_code: string;
    state?: string;
    city?: string;
    postcode?: string;
    datasource: {
      sourcename: string;
      attribution: string;
      license: string;
      url: string;
    };
    name?: string;
    county?: string;
    street?: string;
    lon: number;
    lat: number;
    formatted: string; // This is usually a good display name
    address_line1: string;
    address_line2: string;
    category: string;
    result_type: string;
    rank: {
      importance: number;
      confidence: number;
      confidence_city_level?: number;
      confidence_street_level?: number;
      match_type: string;
    };
    place_id: string; // Unique ID for the place
    housenumber?: string; // Added from example
    suburb?: string; // Added from example
    district?: string; // Added from example
    village?: string; // Added from example
    town?: string; // Added from example
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // lon, lat
  };
  bbox?: [number, number, number, number];
}


interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, details?: { city?: string; country?: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

export default function AddressAutocompleteInput({
  value,
  onChange,
  placeholder = 'Ingresa la dirección...',
  className,
  disabled = false,
}: AddressAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]); // Removed inputValue from dependencies to prevent potential loop

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!GEOAPIFY_API_KEY) {
      console.error("[AddressAutocompleteInput] Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) is missing.");
      setFetchError("Servicio de autocompletado no configurado correctamente (falta API key).");
      setIsLoading(false);
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setFetchError(null);
      if (isLoading) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    
    const requestOptions = { method: 'GET' };
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;

    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: ${query}`);
    try {
      const response = await fetch(url, requestOptions);
      const responseStatus = response.status;
      const responseText = await response.text(); // Read text first for better error details
      console.log(`[AddressAutocompleteInput] Geoapify API response for "${query}" - Status: ${responseStatus}, Body: ${responseText.substring(0, 500)}...`);


      if (!response.ok) {
        let errorDetail = `Error ${responseStatus}: ${response.statusText || 'Unknown error'}`;
        try {
            const errorData = JSON.parse(responseText);
            if (errorData && errorData.message) {
                 errorDetail += ` - ${errorData.message}`;
            } else if (errorData && errorData.error && errorData.error.message) {
                 errorDetail += ` - ${errorData.error.message}`;
            } else if (errorData && errorData.error) {
                errorDetail += ` - ${JSON.stringify(errorData.error)}`;
            }
        } catch (parseErr) { /* Response was not JSON, original errorDetail is fine */ }
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseText);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features as GeoapifyFeature[]);
        setFetchError(null);
      } else {
        console.warn('[AddressAutocompleteInput] Geoapify response "features" was not an array as expected:', data);
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones de Geoapify.");
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput] Error fetching/processing Geoapify suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(error.message?.includes("Failed to fetch") || error.message?.toLowerCase().includes("networkerror")
        ? "Error de red. No se pudo conectar al servicio de direcciones. Por favor, revise su conexión a internet, VPN, firewall o extensiones del navegador."
        : (error.message || "No se pudieron cargar las sugerencias de Geoapify."));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]); // Keep isLoading here to prevent re-fetching if it's already loading

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
    onChange(newInputValue); // Propagate raw input value up
    if (newInputValue.length >= 3) {
      setFetchError(null); // Clear previous errors on new input
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setFetchError(null);
      if(isLoading){ setIsLoading(false); }
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted;
    setInputValue(fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

    const city = props.city || props.town || props.village || props.county || props.state || '';
    const country = props.country || '';
    const lat = props.lat; // Geoapify provides lat/lon directly in properties
    const lng = props.lon;

    onChange(fullAddress, { city, country, lat, lng });
  };
  
  // Diagnostic log for render phase
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
              // Optionally re-fetch if needed, or rely on existing suggestions/error
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
        {(isLoading && inputValue.length >=3) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && inputValue.length >=3 && !isLoading) && (
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
            {/* console.log("[AddressAutocompleteInput RENDER CommandList] isLoading:", isLoading, "fetchError:", fetchError, "suggestions.length:", suggestions.length, "inputValue.length:", inputValue.length) */}
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
                <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                Buscando direcciones...
              </div>
            ) : fetchError ? (
              <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal">
                  <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}
              </CommandEmpty>
            ) : suggestions.length > 0 ? (
              <CommandGroup heading={suggestions.length > 1 ? `${suggestions.length} sugerencias encontradas:` : `1 sugerencia encontrada:`} >
                {suggestions.map((feature) => (
                  <CommandItem
                    key={feature.properties.place_id}
                    value={feature.properties.formatted} // Important for cmdk filtering if enabled
                    onSelect={() => handleSelectSuggestion(feature)}
                    className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">{feature.properties.formatted}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : ( 
              <CommandEmpty className="py-3 px-2.5 text-center text-sm">
                  No se encontraron resultados para "{inputValue}" en Chile.
              </CommandEmpty>
            )}
          </CommandList>
          {/* Overlay to handle clicks outside */}
          <div
              className="fixed inset-0 z-[1000]" 
              onClick={(e) => {
                  if (inputRef.current?.contains(e.target as Node) || commandListRef.current?.contains(e.target as Node)) {
                      return;
                  }
                  setShowSuggestions(false);
              }}
              aria-hidden="true"
          />
        </>
      )}
    </Command>
  );
}
