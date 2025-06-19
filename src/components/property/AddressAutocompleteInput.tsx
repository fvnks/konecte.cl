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
    coordinates: [number, number]; // [lon, lat]
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
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      const errorMsg = "Servicio de autocompletado no disponible (Error GEO_KEY). Contacte al administrador.";
      console.error("[AddressAutocompleteInput CRITICAL] Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) no está configurada.");
      setApiKeyError(errorMsg);
      setShowSuggestionsDropdown(true);
    } else {
      setApiKeyError(null);
    }
  }, []);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchSuggestions = useCallback(async (query: string, signal: AbortSignal) => {
    if (apiKeyError) {
      console.warn("[AddressAutocompleteInput] fetchSuggestions abortado debido a apiKeyError.");
      setFetchError(apiKeyError);
      setIsLoading(false);
      setShowSuggestionsDropdown(true);
      return;
    }
    
    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: "${query}"`);
    setIsLoading(true);
    setFetchError(null); // Clear previous fetch errors
    setSuggestions([]); // Clear previous suggestions
    setShowSuggestionsDropdown(true);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log(`[AddressAutocompleteInput] Fetch URL: ${url}`);

    try {
      const response = await fetch(url, { signal });
      const responseBodyText = await response.text();

      if (signal.aborted) {
        console.log(`[AddressAutocompleteInput] Fetch request for "${query}" was aborted.`);
        return;
      }
      console.log(`[AddressAutocompleteInput] Geoapify API response for "${query}" - Status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status} de Geoapify. `;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorDetail += errorData.message || errorData.error?.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
          errorDetail += `Respuesta no es JSON. Contenido: ${responseBodyText.substring(0,100)}`;
        }
        console.error("[AddressAutocompleteInput ERROR] Geoapify API error:", errorDetail, "Raw Body:", responseBodyText.substring(0, 200));
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      console.log(`[AddressAutocompleteInput] Geoapify response data for "${query}": `, data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        console.log(`[AddressAutocompleteInput] Features count: ${data.features.length}`);
        if (data.features.length === 0) {
          setFetchError(null); // No error, just no results. Message will be handled by CommandEmpty.
        }
      } else {
        console.warn('[AddressAutocompleteInput WARN] Geoapify response "features" not an array or data is null.');
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones. Intente de nuevo.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[AddressAutocompleteInput] Fetch request for "${query}" was intentionally aborted.`);
      } else {
        console.error(`[AddressAutocompleteInput ERROR] Error fetching/processing Geoapify for "${query}":`, error.message, error);
        setSuggestions([]);
        setFetchError(
          error.message.includes("Failed to fetch")
          ? "Error de red. Verifique su conexión, VPN, firewall o extensiones del navegador."
          : (error.message || "No se pudieron cargar las sugerencias. Intente de nuevo.")
        );
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyError]); // apiKeyError is the only external dependency that could change fetchSuggestions behavior

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("[AddressAutocompleteInput] Previous fetch aborted due to new input.");
    }

    if (inputValue && inputValue.length >= 3 && !disabled && !apiKeyError) {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(inputValue, signal);
      }, 300); // Reduced debounce time
    } else {
      setIsLoading(false);
      if (inputValue.length < 3) {
        setSuggestions([]); // Clear suggestions if input is too short
        setFetchError(null);
        setShowSuggestionsDropdown(false);
      } else if (apiKeyError) {
        setSuggestions([]);
        setFetchError(apiKeyError);
        setShowSuggestionsDropdown(true);
      } else {
        setShowSuggestionsDropdown(false); // Default hide
      }
    }
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [inputValue, fetchSuggestions, disabled, apiKeyError]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Propagate raw value for RHF, form state handles the rest
    if(newInputValue.length < 3) {
        setSuggestions([]);
        setFetchError(null);
        setShowSuggestionsDropdown(false);
    } else {
        // Don't immediately set showSuggestionsDropdown to true here; let the debounce effect handle it.
        // This prevents the dropdown from flashing open/closed while typing quickly.
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] Suggestion selected:", fullAddress, "Details:", props);
    setInputValue(fullAddress);
    onChange(fullAddress, {
      city: props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '',
      country: props.country || '',
      lat: props.lat ?? suggestion.geometry?.coordinates[1],
      lng: props.lon ?? suggestion.geometry?.coordinates[0]
    });
    setShowSuggestionsDropdown(false);
    setSuggestions([]);
    setFetchError(null);
  };
  
  const handleFocus = () => {
    // Show dropdown if there's enough input, or an error to display, or already loading, or already has suggestions
    if (inputValue.length >= 3 || apiKeyError || fetchError || isLoading || suggestions.length > 0) {
      setShowSuggestionsDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow click on suggestion items
    setTimeout(() => {
      // Check if the new focused element is part of our command component
      if (commandRef.current && !commandRef.current.contains(document.activeElement)) {
        setShowSuggestionsDropdown(false);
      }
    }, 150);
  };

  // This log is crucial
  console.log(`[AddressAutocompleteInput RENDER] inputValue: "${inputValue}", isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions: ${suggestions.length}, showSuggestionsDropdown: ${showSuggestionsDropdown}, apiKeyError: ${apiKeyError}`);
  
  // Determine if CommandList should be visible based on state
  const shouldRenderCommandList = showSuggestionsDropdown && !disabled;

  return (
    <Command ref={commandRef} shouldFilter={false} onBlur={handleBlur} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled || !!apiKeyError} // Disable input if API key is missing
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {/* Loading/Error indicators directly on the input for immediate feedback */}
        {(isLoading && inputValue.length >=3) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && !isLoading && inputValue.length >=3 && !apiKeyError) && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
        {(apiKeyError && !isLoading) && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={apiKeyError} />
        )}
      </div>

      {shouldRenderCommandList && (
        <CommandList
          className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
          style={{ display: 'block' }} // Force display: block, visibility controlled by parent via shouldRenderCommandList
        >
          {apiKeyError ? (
             <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal">
                <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {apiKeyError}
            </CommandEmpty>
          ) : isLoading ? (
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
                  key={feature.properties.place_id || `sugg-${index}-${Date.now()}`}
                  value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name || `value-${index}`}
                  onSelect={() => handleSelectSuggestion(feature)}
                  className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
                  tabIndex={0} // Make it focusable
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectSuggestion(feature); } }}
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : ( 
            <CommandEmpty className="py-3 px-2.5 text-center text-sm">
                {inputValue.length >=3 ? `No se encontraron resultados para "${inputValue}" en Chile.` : "Escribe al menos 3 caracteres para buscar."}
            </CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  );
}
