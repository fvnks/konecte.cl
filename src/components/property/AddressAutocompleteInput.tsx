// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';

// Interface for Geoapify API response features
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

// Props for the AddressAutocompleteInput component
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
  const [isInputFocused, setIsInputFocused] = useState(false);


  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      const errorMsg = "Servicio de autocompletado no disponible (Error GEO_KEY_CONFIG). Contacte al administrador.";
      console.error("[AddressAutocompleteInput CRITICAL] Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) no está configurada.");
      setApiKeyError(errorMsg);
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
      setSuggestions([]); // Ensure suggestions are cleared
      // setShowSuggestionsDropdown(true) will be handled by onFocus or input change if apiKeyError is present
      return;
    }
     if (query.length < 3) {
        setSuggestions([]);
        setIsLoading(false);
        setFetchError(null);
        // Do not hide dropdown here, let onFocus/onBlur handle it
        return;
    }

    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: "${query}"`);
    setIsLoading(true);
    setFetchError(null);
    // setSuggestions([]); // Cleared in useEffect before calling fetchSuggestions

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
           errorDetail += `Respuesta no es JSON válido. Raw: ${responseBodyText.substring(0,100)}`;
        }
        console.error("[AddressAutocompleteInput ERROR] Geoapify API error:", errorDetail);
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      console.log(`[AddressAutocompleteInput] Geoapify response data for "${query}": `, data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        console.log(`[AddressAutocompleteInput] Features count: ${data.features.length}`);
        setFetchError(null); // Clear any previous fetch error on success
      } else {
        console.warn('[AddressAutocompleteInput WARN] Geoapify response "features" not an array or data is null.');
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[AddressAutocompleteInput] Fetch request for "${query}" was intentionally aborted.`);
      } else {
        console.error(`[AddressAutocompleteInput ERROR] Error fetching/processing Geoapify for "${query}":`, error.message, error);
        setSuggestions([]);
        setFetchError(
          error.message.includes("Failed to fetch") || error.message.includes("NetworkError")
          ? "Error de red. Verifique su conexión, VPN, firewall o extensiones del navegador."
          : (error.message || "No se pudieron cargar las sugerencias. Intente de nuevo.")
        );
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiKeyError]);


  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      console.log("[AddressAutocompleteInput] Aborting previous fetch in useEffect[inputValue].");
      abortControllerRef.current.abort();
    }

    if (inputValue && inputValue.length >= 3 && !disabled && !apiKeyError) {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      setSuggestions([]); // Clear previous suggestions immediately for new input
      setFetchError(null);
      setIsLoading(true); // Set loading true before debounce
      setShowSuggestionsDropdown(true); // Show dropdown when typing valid input

      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(inputValue, signal);
      }, 300); // Adjusted debounce to 300ms
    } else {
      setIsLoading(false);
      setSuggestions([]);
      setFetchError(null);
      if (inputValue.length < 3 && isInputFocused) {
        // Keep dropdown open if focused and less than 3 chars to show "type more" message
        setShowSuggestionsDropdown(true);
      } else if (!isInputFocused) {
        setShowSuggestionsDropdown(false);
      }
    }
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) {
          console.log("[AddressAutocompleteInput] Aborting fetch in useEffect[inputValue] cleanup.");
          abortControllerRef.current.abort();
      }
    };
  }, [inputValue, disabled, apiKeyError, fetchSuggestions, isInputFocused]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue);
  };

  const handleSelectSuggestion = (feature: GeoapifyFeature) => {
    const props = feature.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] Suggestion selected:", fullAddress, "Details:", props);

    setInputValue(fullAddress);
    onChange(fullAddress, {
      city: props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '',
      country: props.country || '',
      lat: props.lat ?? feature.geometry?.coordinates[1],
      lng: props.lon ?? feature.geometry?.coordinates[0]
    });

    setShowSuggestionsDropdown(false); // Hide dropdown on selection
    setSuggestions([]);
    setFetchError(null);
    if (inputRef.current) inputRef.current.blur(); // Optionally blur input on selection
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (commandRef.current && !commandRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (inputValue.length >= 3 || apiKeyError || fetchError) {
      setShowSuggestionsDropdown(true);
    } else if (inputValue.length < 3) {
        setShowSuggestionsDropdown(true); // Show to display "type more" message
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Don't hide immediately on blur, let click-outside or selection handle it.
    // This prevents the dropdown from closing if user clicks on a suggestion item.
    // If click-outside is preferred, this setTimeout can be removed or adjusted.
    // setTimeout(() => {
    //    if (!commandRef.current?.contains(document.activeElement) && !inputRef.current?.contains(document.activeElement)) {
    //        setShowSuggestionsDropdown(false);
    //    }
    // }, 150);
  };


  console.log(`[AddressAutocompleteInput RENDER] inputValue: "${inputValue}", isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions: ${suggestions.length}, showSuggestionsDropdown: ${showSuggestionsDropdown}, apiKeyError: ${apiKeyError}, isInputFocused: ${isInputFocused}`);
  
  let commandListContent;
  if (apiKeyError) {
    commandListContent = (
      <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal">
        <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {apiKeyError}
      </CommandEmpty>
    );
  } else if (isLoading) {
    commandListContent = (
      <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
        <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
        Buscando direcciones...
      </div>
    );
  } else if (fetchError) {
    commandListContent = (
      <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal">
        <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}
      </CommandEmpty>
    );
  } else if (suggestions.length > 0) {
    commandListContent = (
      <CommandGroup heading={suggestions.length === 1 ? `1 sugerencia:` : `${suggestions.length} sugerencias:`}>
        {suggestions.map((feature, index) => (
          <CommandItem
            key={feature.properties.place_id || `sugg-${index}-${Date.now()}`}
            value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name || `value-${index}`}
            onSelect={() => handleSelectSuggestion(feature)}
            className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectSuggestion(feature); } }}
          >
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  } else if (inputValue.length >= 3 && isInputFocused) { // Show "no results" only if search was attempted and input is focused
    commandListContent = (
      <CommandEmpty className="py-3 px-2.5 text-center text-sm">
        No se encontraron resultados para "{inputValue}" en Chile.
      </CommandEmpty>
    );
  } else if (inputValue.length < 3 && isInputFocused) { // Show "type more" if input is short and focused
     commandListContent = (
      <CommandEmpty className="py-3 px-2.5 text-center text-sm">
        Escribe al menos 3 caracteres para buscar.
      </CommandEmpty>
    );
  } else {
    commandListContent = null; // Nothing to show, dropdown won't open or will be empty if forced open
  }


  return (
    <Command ref={commandRef} shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled || !!apiKeyError}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {/* Visual Indicators on Input are less critical now that dropdown shows messages */}
      </div>

      {showSuggestionsDropdown && commandListContent && (
        <CommandList
          className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
        >
          {commandListContent}
        </CommandList>
      )}
    </Command>
  );
}

