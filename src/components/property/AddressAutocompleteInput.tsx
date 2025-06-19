// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

interface GeoapifyProperty {
  country?: string;
  country_code?: string;
  state?: string;
  county?: string;
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
  place_id: string;
  name?: string;
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
    if (!GEOAPIFY_API_KEY) {
      console.error("[AddressAutocompleteInput] FATAL: Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) is not configured.");
      setFetchError("Servicio de autocompletado no disponible (Error de Configuración API).");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!GEOAPIFY_API_KEY) return;
    
    console.log(`[AddressAutocompleteInput] Fetching for: ${query}`);
    setIsLoading(true);
    setFetchError(null);
    setSuggestions([]); // Clear previous suggestions immediately

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log("[AddressAutocompleteInput] Fetch URL:", url);

    try {
      const response = await fetch(url, { method: 'GET' });
      const responseBodyText = await response.text(); // Get text first for better error inspection
      console.log(`[AddressAutocompleteInput] Geoapify API response for "${query}" - Status: ${response.status}`); // Log status
      // console.log(`[AddressAutocompleteInput] Geoapify API response BODY for "${query}" : ${responseBodyText.substring(0,300)}...`);


      if (!response.ok) {
        let errorDetail = `Error ${response.status} de la API. `;
        try {
            const errorData = JSON.parse(responseBodyText);
            errorDetail += errorData.message || errorData.error?.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
            errorDetail += `Respuesta no JSON: ${responseBodyText.substring(0,100)}`;
        }
        console.error("[AddressAutocompleteInput] API Error Detail:", errorDetail);
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseBodyText);
      console.log("[AddressAutocompleteInput] Geoapify API response PARSED DATA:", data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        if (data.features.length === 0) {
            console.log("[AddressAutocompleteInput] Geoapify returned 0 features for query:", query);
        }
      } else {
        console.warn('[AddressAutocompleteInput] Geoapify response "features" was not an array or data is null:', data);
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput] Error fetching/processing Geoapify suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(
        error.message.toLowerCase().includes("failed to fetch") || error.message.toLowerCase().includes("networkerror")
        ? "Error de red. Revisa tu conexión, VPN, firewall o extensiones del navegador."
        : (error.message || "No se pudieron cargar las sugerencias.")
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array because state setters are stable and GEOAPIFY_API_KEY is module-level

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        if (isLoading) setIsLoading(false);
        // Do not hide suggestions if there's a fetch error we want to display
        if (!fetchError) setShowSuggestions(false); 
      }
    }, 600);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchSuggestions, disabled, isLoading, fetchError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); 
    setFetchError(null); // Clear previous errors on new input

    if (newInputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      if (isLoading) setIsLoading(false); 
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    
    console.log("[AddressAutocompleteInput] Suggestion selected:", suggestion, "Setting input to:", `"${fullAddress}"`);

    setInputValue(fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

    const city = props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '';
    const country = props.country || '';
    const lat = props.lat ?? suggestion.geometry?.coordinates[1];
    const lng = props.lon ?? suggestion.geometry?.coordinates[0];
    
    onChange(fullAddress, { city, country, lat, lng });
  };
  
  const shouldShowCommandList = inputValue.length >= 3 && showSuggestions && !disabled && GEOAPIFY_API_KEY;

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
              setShowSuggestions(true);
              if (!isLoading && (fetchError || suggestions.length === 0)) {
                 fetchSuggestions(inputValue); // Re-fetch if error or no suggestions on focus
              }
            }
          }}
          placeholder={placeholder}
          disabled={disabled || !GEOAPIFY_API_KEY}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {(isLoading && inputValue.length >=3 && !disabled && GEOAPIFY_API_KEY && !fetchError) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && inputValue.length >=3 && !isLoading && !disabled && GEOAPIFY_API_KEY) && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {shouldShowCommandList && (
        <>
          <CommandList
            ref={commandListRef}
            className={cn(
              "absolute z-[1001] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
            )}
          >
            {/* Diagnostic Log */}
            {/* {console.log(`[AddressAutocompleteInput RENDER CommandList] Loading: ${isLoading}, Error: "${fetchError}", Suggestions:`, suggestions.length, suggestions.map(s => s.properties.formatted))} */}

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
              <CommandGroup heading={suggestions.length > 1 ? `${suggestions.length} sugerencias:` : `1 sugerencia:`}>
                {suggestions.map((feature, index) => (
                  <CommandItem
                    key={feature.properties.place_id || `geoapify-sugg-${index}`}
                    value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name || `value-${index}`}
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
              style={{ pointerEvents: showSuggestions ? 'auto' : 'none' }}
          />
        </>
      )}
      {!GEOAPIFY_API_KEY && (
        <p className="text-xs text-destructive mt-1">
          <AlertTriangle className="inline-block h-3 w-3 mr-1"/> Error de configuración del servicio de direcciones.
        </p>
      )}
    </Command>
  );
}

