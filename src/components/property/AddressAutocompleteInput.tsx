
// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

// Define the structure for Geoapify suggestion properties
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

// Define the structure for a Geoapify feature
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

  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      console.error("[AddressAutocompleteInput ERROR] Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) no está configurada.");
      setFetchError("Servicio de autocompletado no disponible (Error de Configuración API).");
      setShowSuggestionsDropdown(true);
    }
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!GEOAPIFY_API_KEY) {
      setFetchError("API Key no configurada.");
      setShowSuggestionsDropdown(true);
      setIsLoading(false);
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    console.log(`[AddressAutocompleteInput LOG] Fetching from Geoapify for: ${query}`);
    setIsLoading(true);
    setFetchError(null);
    setSuggestions([]);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const responseBodyText = await response.text();
      console.log(`[AddressAutocompleteInput LOG] Geoapify API response for "${query}" - Status: ${response.status}, Body: ${responseBodyText.substring(0, 300)}...`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status} de Geoapify. `;
        try {
            const errorData = JSON.parse(responseBodyText);
            errorDetail += errorData.message || errorData.error?.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
            errorDetail += `Respuesta no es JSON: ${responseBodyText.substring(0,100)}`;
        }
        throw new Error(errorDetail);
      }
      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        if (data.features.length === 0) console.log("[AddressAutocompleteInput LOG] Geoapify returned 0 features.");
      } else {
        console.warn('[AddressAutocompleteInput WARN] Geoapify response "features" was not an array or data is null:', data);
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput ERROR] Error fetching/processing Geoapify suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(
        error.message.includes("Failed to fetch") 
        ? "Error de red. Revisa tu conexión, VPN, firewall o extensiones del navegador." 
        : (error.message || "No se pudieron cargar las sugerencias.")
      );
    } finally {
      setIsLoading(false);
      setShowSuggestionsDropdown(true); 
    }
  }, []); // GEOAPIFY_API_KEY is module-level, setters are stable

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (inputValue && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
      debounceTimeoutRef.current = setTimeout(() => fetchSuggestions(inputValue), 500);
    } else {
      setSuggestions([]);
      if (!fetchError && (!GEOAPIFY_API_KEY || inputValue.length < 3)) {
        setShowSuggestionsDropdown(false);
      }
      if (isLoading) setIsLoading(false);
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [inputValue, fetchSuggestions, disabled, isLoading, fetchError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); 
    if (newInputValue.length >= 3) {
      setFetchError(null); 
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
      setSuggestions([]);
      if (isLoading) setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    setInputValue(fullAddress);
    setSuggestions([]);
    setShowSuggestionsDropdown(false);
    setFetchError(null);
    const city = props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '';
    const country = props.country || '';
    const lat = props.lat ?? suggestion.geometry?.coordinates[1];
    const lng = props.lon ?? suggestion.geometry?.coordinates[0];
    onChange(fullAddress, { city, country, lat, lng });
  };

  const handleFocus = () => {
    if (inputValue && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
      setShowSuggestionsDropdown(true);
      if (!isLoading && suggestions.length === 0 && !fetchError) {
        fetchSuggestions(inputValue);
      }
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (inputRef.current && document.activeElement !== inputRef.current &&
          (!commandListRef.current || !commandListRef.current.contains(document.activeElement))) {
        setShowSuggestionsDropdown(false);
      }
    }, 150);
  };
  
  const shouldRenderCommandList = showSuggestionsDropdown && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY;

  // console.log(`[AddressAutocompleteInput RENDER] inputValue: "${inputValue}", isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions:`, suggestions.length, `showSuggestionsDropdown: ${showSuggestionsDropdown}, shouldRenderCommandList: ${shouldRenderCommandList}`);

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || !GEOAPIFY_API_KEY}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {(isLoading && inputValue.length >=3 && !disabled && GEOAPIFY_API_KEY && !fetchError) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && shouldRenderCommandList && !isLoading) && (
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {shouldRenderCommandList && (
        <CommandList
          ref={commandListRef}
          className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
          tabIndex={-1} 
        >
          {isLoading && suggestions.length === 0 && !fetchError ? (
            <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
              Buscando...
            </div>
          ) : fetchError ? (
            <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal">
                <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}
            </CommandEmpty>
          ) : suggestions.length > 0 ? (
            <CommandGroup heading={suggestions.length > 1 ? `${suggestions.length} sugerencias:` : `1 sugerencia:`}>
              {suggestions.map((feature, index) => (
                <CommandItem
                  key={feature.properties.place_id || `sugg-${index}`}
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
      )}
      {!GEOAPIFY_API_KEY && !fetchError && ( // Mostrar este error solo si no hay otro error de fetch
        <p className="text-xs text-destructive mt-1">
          <AlertTriangle className="inline-block h-3 w-3 mr-1"/> Error de Configuración: Servicio de direcciones no disponible.
        </p>
      )}
    </Command>
  );
}
