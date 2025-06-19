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
    coordinates: [number, number];
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
  const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      console.error("[AddressAutocompleteInput] FATAL: Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) no está configurada.");
      setFetchError("Servicio de autocompletado no disponible (Error de Configuración).");
      setIsLoading(false);
    }
    console.log("[AddressAutocompleteInput] API Key loaded:", GEOAPIFY_API_KEY ? "Yes" : "No");
  }, [GEOAPIFY_API_KEY]);

  useEffect(() => {
    if (value !== inputValue) {
      // console.log("[AddressAutocompleteInput Effect] External 'value' prop changed. Updating internal 'inputValue'. New value:", value, "Current inputValue:", inputValue);
      setInputValue(value);
    }
  }, [value]); // Removed inputValue from here - only sync from prop to internal state

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!GEOAPIFY_API_KEY) {
        console.warn("[AddressAutocompleteInput fetchSuggestions] No API Key, skipping fetch.");
        setFetchError("API Key no configurada.");
        return;
    }
    if (query.length < 3) {
        console.log("[AddressAutocompleteInput fetchSuggestions] Query too short, skipping fetch.");
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
    }
    
    console.log(`[AddressAutocompleteInput fetchSuggestions] Initiating for query: "${query}"`);
    setIsLoading(true);
    setFetchError(null);
    // setSuggestions([]); // Clear old suggestions immediately when starting a new fetch

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log("[AddressAutocompleteInput fetchSuggestions] Fetching from Geoapify URL:", url);

    try {
      const response = await fetch(url, { method: 'GET' });
      const responseBodyText = await response.text();
      console.log(`[AddressAutocompleteInput fetchSuggestions] Geoapify API response for "${query}" - Status: ${response.status}`);
      // console.log(`[AddressAutocompleteInput fetchSuggestions] Body: ${responseBodyText.substring(0,300)}...`);


      if (!response.ok) {
        let errorDetail = `Error ${response.status} de la API de Geoapify. `;
        try {
            const errorData = JSON.parse(responseBodyText);
            errorDetail += errorData.message || errorData.error?.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
            errorDetail += `Respuesta no es JSON: ${responseBodyText.substring(0,100)}`;
        }
        console.error("[AddressAutocompleteInput fetchSuggestions] API Error Detail:", errorDetail);
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseBodyText);
      console.log("[AddressAutocompleteInput fetchSuggestions] Geoapify API PARSED DATA:", data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        setShowSuggestions(true); // Show suggestions if we got some
        if (data.features.length === 0) {
            console.log("[AddressAutocompleteInput fetchSuggestions] Geoapify returned 0 features for query:", query);
        }
      } else {
        console.warn('[AddressAutocompleteInput fetchSuggestions] Geoapify response "features" was not an array or data is null:', data);
        setSuggestions([]);
        setShowSuggestions(true); // Show suggestions even if empty to display "no results"
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput fetchSuggestions] Error fetching/processing:", error.message, error);
      setSuggestions([]);
      setShowSuggestions(true); // Show suggestions to display the error message
      setFetchError(
        error.message.toLowerCase().includes("failed to fetch")
        ? "Error de red. No se pudo conectar al servicio de direcciones. Revisa tu conexión, VPN, firewall o extensiones del navegador."
        : (error.message || "No se pudieron cargar las sugerencias.")
      );
    } finally {
      setIsLoading(false);
      console.log("[AddressAutocompleteInput fetchSuggestions] Finished. isLoading:", false);
    }
  }, [GEOAPIFY_API_KEY]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (inputValue && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
      console.log(`[AddressAutocompleteInput DebounceEffect] Scheduling fetch for "${inputValue}"`);
      debounceTimeoutRef.current = setTimeout(() => {
        console.log(`[AddressAutocompleteInput DebounceEffect] Debounce timeout fired for "${inputValue}". Calling fetchSuggestions.`);
        fetchSuggestions(inputValue);
      }, 500);
    } else {
      console.log(`[AddressAutocompleteInput DebounceEffect] Conditions not met for fetch. inputValue: "${inputValue}", length: ${inputValue?.length}`);
      setSuggestions([]);
      if (!fetchError) setShowSuggestions(false); // Hide if no active error and not enough input
      if (isLoading) setIsLoading(false);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputValue, fetchSuggestions, disabled, GEOAPIFY_API_KEY]); // Removed isLoading from here

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    console.log("[AddressAutocompleteInput] handleInputChange. New value:", newInputValue);
    setInputValue(newInputValue); // Update internal state first
    onChange(newInputValue);    // Propagate raw input for controlled component behavior

    if (newInputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY) {
      // No need to call fetchSuggestions directly, useEffect will handle it via debounce
      setShowSuggestions(true); // Immediately prepare to show list
      setFetchError(null); // Clear previous errors on new input
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      if (isLoading) setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] handleSelectSuggestion. Selected:", `"${fullAddress}"`, suggestion);

    setInputValue(fullAddress); // Update input field display
    setSuggestions([]);
    setShowSuggestions(false);
    setFetchError(null);

    const city = props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '';
    const country = props.country || '';
    const lat = props.lat ?? suggestion.geometry?.coordinates[1];
    const lng = props.lon ?? suggestion.geometry?.coordinates[0];
    
    onChange(fullAddress, { city, country, lat, lng }); // Propagate selected, structured data
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click on suggestion item
    setTimeout(() => {
      if (!commandListRef.current?.contains(document.activeElement)) {
         // console.log("[AddressAutocompleteInput] onBlur, hiding suggestions.");
        setShowSuggestions(false);
      }
    }, 150);
  };

  const shouldShowCommandList = showSuggestions && inputValue.length >= 3 && !disabled && GEOAPIFY_API_KEY;

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
              console.log("[AddressAutocompleteInput] onFocus, conditions met, setShowSuggestions(true)");
              setShowSuggestions(true);
              if (!isLoading && (fetchError || suggestions.length === 0)) {
                 console.log("[AddressAutocompleteInput] onFocus, triggering fetchSuggestions due to error or no suggestions.");
                 fetchSuggestions(inputValue); // Trigger fetch if focused and list is empty or errored
              }
            }
          }}
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
        {(fetchError && shouldShowCommandList && !isLoading) && ( // Only show error icon if suggestions list would be visible
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
            {/* console.log(`[AddressAutocompleteInput RENDER CommandList] isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions.length: ${suggestions.length}, inputValue: "${inputValue}"`) */}
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
          {/* Overlay to handle clicks outside to close suggestions is no longer strictly needed with onBlur, but can be a fallback */}
          {/* <div className="fixed inset-0 z-[1000]" onClick={() => setShowSuggestions(false)} aria-hidden="true" style={{ pointerEvents: showSuggestions ? 'auto' : 'none' }}/> */}
        </>
      )}
      {!GEOAPIFY_API_KEY && (
        <p className="text-xs text-destructive mt-1">
          <AlertTriangle className="inline-block h-3 w-3 mr-1"/> Error de configuración: API Key no disponible.
        </p>
      )}
    </Command>
  );
}
