
// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

interface GeoapifyProperty {
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  postcode?: string;
  street?: string;
  housenumber?: string;
  lon?: number;
  lat?: number;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  category?: string;
  result_type?: string;
  place_id: string; // place_id is usually present and good for key
  name?: string; // Sometimes 'name' is present for points of interest
  suburb?: string;
  district?: string;
  village?: string;
  town?: string;
}

interface GeoapifyFeature {
  type: string;
  properties: GeoapifyProperty;
  geometry?: {
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
  const commandListRef = useRef<HTMLDivElement>(null); // Ref for the command list

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
        console.error("FATAL: Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) is not available in the client. Check .env file and ensure the NEXT_PUBLIC_ prefix is used.");
        setFetchError("Error de configuración: Falta la clave API del servicio de direcciones. Contacte al administrador.");
    }
  }, []);


  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const fetchSuggestions = useCallback(async (query: string) => {
    console.log("[AddressAutocompleteInput] fetchSuggestions called with query:", query);
    if (!GEOAPIFY_API_KEY) {
      console.error("[AddressAutocompleteInput] Geoapify API Key is missing. Aborting fetch.");
      setFetchError("Servicio de autocompletado no configurado correctamente (falta API key).");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setFetchError(null);
    setSuggestions([]); // Clear previous suggestions

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log("[AddressAutocompleteInput] Fetching URL:", url);

    try {
      const response = await fetch(url, { method: 'GET' });
      console.log(`[AddressAutocompleteInput] Geoapify API response status for "${query}": ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status}: ${response.statusText || 'Error desconocido de Geoapify'}`;
        try {
            const errorData = await response.json();
            console.error("[AddressAutocompleteInput] Geoapify API error data:", errorData);
            if (errorData && errorData.message) {
                 errorDetail += ` - ${errorData.message}`;
            } else if (errorData && errorData.error && errorData.error.message) {
                 errorDetail += ` - ${errorData.error.message}`;
            } else if (errorData && errorData.error) {
                errorDetail += ` - ${JSON.stringify(errorData.error)}`;
            }
        } catch (parseErr) {
            const errorText = await response.text(); // Re-read or handle if not already read
            console.warn("[AddressAutocompleteInput] Geoapify error response was not JSON:", errorText);
            errorDetail += ` - Respuesta no JSON: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("[AddressAutocompleteInput] Geoapify API response data:", data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        if (data.features.length === 0) {
            console.log("[AddressAutocompleteInput] Geoapify returned 0 features for query:", query);
        }
      } else {
        console.warn('[AddressAutocompleteInput] Geoapify response "features" was not an array:', data);
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput] Error fetching/processing Geoapify suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(
        error.message.toLowerCase().includes("failed to fetch") || error.message.toLowerCase().includes("networkerror")
        ? "Error de red. No se pudo conectar al servicio de direcciones. Revisa tu conexión, VPN, firewall o extensiones del navegador."
        : (error.message || "No se pudieron cargar las sugerencias de Geoapify.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed onChange as it's not directly used here, only in handleSelectSuggestion.

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue && inputValue.length >= 3 && !disabled) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        if(isLoading){ setIsLoading(false); }
        if(inputValue.length < 3) { setFetchError(null); } // Clear error if input too short
      }
    }, 600); // Slightly increased debounce

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchSuggestions, disabled, isLoading]); // Added isLoading to dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Propagate raw input value up for controlled component behavior
    if (newInputValue.length >= 3) {
      setFetchError(null); // Clear previous errors on new input
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      if(isLoading){ setIsLoading(false); } // Stop loading if input becomes too short
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || ''; // Use formatted, fallback to address_line1 or name
    
    console.log("[AddressAutocompleteInput] Suggestion selected:", suggestion);
    console.log("[AddressAutocompleteInput] Setting input to:", fullAddress);

    setInputValue(fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

    const city = props.city || props.town || props.village || props.suburb || props.district || props.county || props.state || '';
    const country = props.country || '';
    // Geoapify returns coordinates as [lon, lat] in geometry, or directly in properties
    const lat = props.lat ?? suggestion.geometry?.coordinates[1];
    const lng = props.lon ?? suggestion.geometry?.coordinates[0];

    onChange(fullAddress, { city, country, lat, lng });
  };

  // Log for render phase
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
            if (inputValue && inputValue.length >= 3 && !disabled) {
              setShowSuggestions(true);
              // Re-fetch if no suggestions and no error, or if there was a previous error
              if ((suggestions.length === 0 && !fetchError && !isLoading) || fetchError) {
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
        {(isLoading && inputValue.length >=3 && !disabled) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && inputValue.length >=3 && !isLoading && !disabled) && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {inputValue.length >= 3 && showSuggestions && !disabled && (
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
                    key={feature.properties.place_id || feature.properties.formatted} // Use place_id if available
                    value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name} // Value for cmdk filtering, if enabled
                    onSelect={() => handleSelectSuggestion(feature)}
                    className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
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
                  if (
                      !inputRef.current?.contains(e.target as Node) &&
                      !commandListRef.current?.contains(e.target as Node)
                  ) {
                      setShowSuggestions(false);
                  }
              }}
              aria-hidden="true"
          />
        </>
      )}
    </Command>
  );
}

