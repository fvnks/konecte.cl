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
    // Sync external value prop with internal inputValue state
    // Only update inputValue if the external value has actually changed
    // to avoid potential loops if onChange updates the external value immediately.
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on external value

  const fetchSuggestions = useCallback(async (query: string, signal: AbortSignal) => {
    if (apiKeyError) {
      console.log("[AddressAutocompleteInput] Fetch aborted due to apiKeyError.");
      setFetchError(apiKeyError);
      setIsLoading(false);
      setSuggestions([]);
      return;
    }
    if (query.length < 3) {
      console.log("[AddressAutocompleteInput] Query too short, clearing suggestions.");
      setSuggestions([]);
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: "${query}"`);
    setIsLoading(true); // Set loading true *before* the fetch
    setFetchError(null);
    // Suggestions are cleared in the main useEffect before calling this.

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log(`[AddressAutocompleteInput] Fetch URL: ${url}`);

    try {
      const response = await fetch(url, { signal });
      const responseBodyText = await response.text(); // Read body once

      if (signal.aborted) {
        console.log(`[AddressAutocompleteInput] Fetch request for "${query}" was aborted.`);
        // Do not change isLoading here, let the new request handle it.
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
        throw new Error(errorDetail); // This will be caught by the catch block below
      }

      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      console.log(`[AddressAutocompleteInput] Geoapify response data for "${query}": `, data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features); // Update suggestions
        console.log(`[AddressAutocompleteInput] Features count: ${data.features.length}`);
        setFetchError(null);
      } else {
        console.warn('[AddressAutocompleteInput WARN] Geoapify response "features" not an array or data is null.');
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[AddressAutocompleteInput] Fetch request for "${query}" was intentionally aborted (name: AbortError).`);
      } else {
        console.error(`[AddressAutocompleteInput ERROR] Error fetching/processing Geoapify for "${query}":`, error.message, error);
        setSuggestions([]); // Clear suggestions on error
        setFetchError(
          error.message.includes("Failed to fetch") || error.message.includes("NetworkError")
          ? "Error de red. Verifique su conexión, VPN, firewall o extensiones del navegador."
          : (error.message || "No se pudieron cargar las sugerencias. Intente de nuevo.")
        );
      }
    } finally {
      // Only set isLoading to false if this specific fetch attempt wasn't aborted
      // and another one isn't already in progress due to rapid input.
      // Let the new fetch call control isLoading.
      if (!signal.aborted) {
         setIsLoading(false);
      }
    }
  }, [apiKeyError]); // Only apiKeyError, as other states are managed within the effect or setters are stable

  useEffect(() => {
    // Cleanup previous debounce timeout and abort controller
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      console.log("[AddressAutocompleteInput] Aborting previous fetch in useEffect[inputValue].");
      abortControllerRef.current.abort();
    }

    if (inputValue && inputValue.length >= 3 && !disabled && !apiKeyError && isInputFocused) {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      setSuggestions([]); // Clear previous suggestions immediately
      setFetchError(null); // Clear previous error
      setIsLoading(true); // Set loading true *before* debounce timer

      debounceTimeoutRef.current = setTimeout(() => {
        if (!signal.aborted) { // Check if not aborted before fetching
            fetchSuggestions(inputValue, signal);
        } else {
            console.log("[AddressAutocompleteInput] Debounced fetch for '"+inputValue+"' was aborted before execution.");
            setIsLoading(false); // Ensure loading is false if fetch was pre-aborted
        }
      }, 500);
    } else {
      setIsLoading(false); // Not enough input or disabled, so not loading
      setSuggestions([]); // Clear suggestions if input is too short
      if (inputValue.length === 0 && !apiKeyError) {
          setFetchError(null); // Clear errors if input is empty
      }
    }

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) {
          console.log("[AddressAutocompleteInput] Aborting fetch in useEffect[inputValue] cleanup.");
          abortControllerRef.current.abort();
      }
    };
  }, [inputValue, disabled, apiKeyError, fetchSuggestions, isInputFocused]); // isInputFocused is key here

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); 
  };

  const handleSelectSuggestion = (feature: GeoapifyFeature) => {
    const props = feature.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] Suggestion selected:", fullAddress, "Details:", props);

    setInputValue(fullAddress); // Update internal input value
    onChange(fullAddress, { // Call parent's onChange with full details
      city: props.city || props.town || props.village || props.county || props.suburb || props.district || props.state || '',
      country: props.country || '',
      lat: props.lat ?? feature.geometry?.coordinates[1],
      lng: props.lon ?? feature.geometry?.coordinates[0]
    });
    setIsInputFocused(false); // Hide dropdown
    setSuggestions([]); // Clear suggestions
    setFetchError(null); // Clear any errors
  };
  
  const handleInputFocus = () => {
    console.log("[AddressAutocompleteInput] Input focused.");
    setIsInputFocused(true);
  };
  
  const handleInputBlur = () => {
    console.log("[AddressAutocompleteInput] Input blurred.");
    // Use setTimeout to allow click on suggestion item before hiding
    setTimeout(() => {
        const activeEl = document.activeElement;
        if (
            commandRef.current && !commandRef.current.contains(activeEl) &&
            inputRef.current && !inputRef.current.contains(activeEl)
        ) {
            console.log("[AddressAutocompleteInput] Blur caused dropdown to hide.");
            setIsInputFocused(false);
        } else {
            console.log("[AddressAutocompleteInput] Blur detected, but focus moved to suggestion or input still focused.");
        }
    }, 150); // Small delay to catch clicks on items
  };

  const shouldShowDropdown = isInputFocused && (
    apiKeyError || 
    fetchError || 
    isLoading || 
    (suggestions.length > 0 && inputValue.length >=3) || 
    (inputValue.length > 0 && inputValue.length < 3) // Show "type more" message
  );
  
  console.log(`[AddressAutocompleteInput RENDER] inputValue: "${inputValue}", isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions: ${suggestions.length}, shouldShowDropdown: ${shouldShowDropdown}, apiKeyError: ${apiKeyError}, isInputFocused: ${isInputFocused}`);
  
  let commandListContent;
  if (apiKeyError) {
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal"><AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {apiKeyError}</CommandEmpty>;
  } else if (isLoading) {
    commandListContent = <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center"><Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />Buscando direcciones...</div>;
  } else if (fetchError) {
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal"><AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}</CommandEmpty>;
  } else if (suggestions.length > 0 && inputValue.length >=3) {
    commandListContent = (
      <CommandGroup heading={`${suggestions.length} sugerencia${suggestions.length > 1 ? 's' : ''}:`}>
        {suggestions.map((feature, index) => (
          <CommandItem
            key={feature.properties.place_id || `sugg-${index}-${Date.now()}`}
            value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name || `value-${index}`}
            onSelect={() => handleSelectSuggestion(feature)}
            className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
            // onMouseDown is important here to prevent blur from hiding the list before click registers
            onMouseDown={(e) => e.preventDefault()}
          >
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  } else if (inputValue.length >= 3 && isInputFocused) { // Only show "no results" if actively focused and searched
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm">No se encontraron resultados para "{inputValue}".</CommandEmpty>;
  } else if (inputValue.length > 0 && inputValue.length < 3 && isInputFocused) { // Show "type more" if input is short and focused
     commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm">Escribe al menos 3 caracteres para buscar.</CommandEmpty>;
  } else {
    commandListContent = null; // No content if not focused or input is empty
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
      </div>
      {shouldShowDropdown && commandListContent && (
        <CommandList
          className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
        >
          {commandListContent}
        </CommandList>
      )}
    </Command>
  );
}
