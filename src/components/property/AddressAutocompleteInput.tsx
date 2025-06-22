// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { regionNameToSpanish } from '@/lib/data';

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
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, details?: { city?: string; region?: string; country?: string; lat?: number; lng?: number }) => void;
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

  const componentRootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null); // Ref for CommandList

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInputFocusedRef = useRef(isInputFocused);

  useEffect(() => {
    isInputFocusedRef.current = isInputFocused;
  }, [isInputFocused]);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      const errorMsg = "Servicio de autocompletado no disponible (Error GEO_KEY_CONFIG).";
      console.error("[AddressAutocompleteInput CRITICAL] Geoapify API Key no configurada.");
      setApiKeyError(errorMsg);
    } else {
      setApiKeyError(null);
    }
  }, []);

  useEffect(() => {
    if (value !== inputValue && !isInputFocusedRef.current) { // Use ref here
      setInputValue(value);
    }
  }, [value, inputValue]);

  const fetchSuggestionsInternal = useCallback(async (query: string, signal: AbortSignal) => {
    if (apiKeyError) {
      setFetchError(apiKeyError);
      setIsLoading(false);
      setSuggestions([]);
      return;
    }

    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: "${query}"`);
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log(`[AddressAutocompleteInput] Fetch URL: ${url}`);

    try {
      const response = await fetch(url, { signal });
      if (signal.aborted) {
        console.log(`[AddressAutocompleteInput] Fetch for "${query}" was aborted (in fetchSuggestionsInternal).`);
        return;
      }

      const responseBodyText = await response.text();
      console.log(`[AddressAutocompleteInput] Geoapify API response for "${query}" - Status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status} de Geoapify. `;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorDetail += errorData.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
          errorDetail += `Raw: ${responseBodyText.substring(0,100)}`;
        }
        throw new Error(errorDetail);
      }

      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      console.log(`[AddressAutocompleteInput] Geoapify response data for "${query}": `, data);

      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        setFetchError(null);
        console.log(`[AddressAutocompleteInput] Features count: ${data.features.length}`);
      } else {
        setSuggestions([]);
        setFetchError("Respuesta inesperada del servicio de direcciones.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[AddressAutocompleteInput] Fetch for "${query}" intentionally aborted by AbortController.`);
      } else {
        console.error(`[AddressAutocompleteInput ERROR] Error fetching/processing for "${query}":`, error.message);
        setSuggestions([]);
        setFetchError(error.message.includes("Failed to fetch") || error.message.includes("NetworkError") ? "Error de red. Verifique su conexión." : (error.message || "No se pudieron cargar las sugerencias."));
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiKeyError]);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (abortControllerRef.current) {
      console.log("[AddressAutocompleteInput] Aborting previous fetch in useEffect[inputValue].");
      abortControllerRef.current.abort();
    }

    if (inputValue.length >= 3 && !disabled && !apiKeyError) {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setSuggestions([]);
      setFetchError(null);
      setIsLoading(true);

      debounceTimeoutRef.current = setTimeout(() => {
        // Crucially, check isInputFocusedRef.current here
        if (!signal.aborted && isInputFocusedRef.current) {
            fetchSuggestionsInternal(inputValue, signal);
        } else {
            console.log(`[AddressAutocompleteInput] Debounced fetch for "${inputValue}" was aborted or input lost focus before execution.`);
            if(!signal.aborted && !isInputFocusedRef.current) setIsLoading(false);
        }
      }, 500);
    } else {
      setIsLoading(false);
      if (inputValue.length < 3) {
        setSuggestions([]);
        setFetchError(null);
      }
    }

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) {
        console.log("[AddressAutocompleteInput] Aborting fetch in useEffect[inputValue] cleanup.");
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, disabled, apiKeyError, fetchSuggestionsInternal]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentRootRef.current &&
        !componentRootRef.current.contains(event.target as Node)
      ) {
        console.log("[AddressAutocompleteInput] Clicked outside. Setting isInputFocused to false.");
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
    onChange(newInputValue); // Propagate raw input change immediately

    if (newInputValue.length < 3) {
      setSuggestions([]);
      setFetchError(null);
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    } else if (isInputFocusedRef.current) {
      setIsLoading(true); 
    }
  };

  const handleSelectSuggestion = (feature: GeoapifyFeature) => {
    const props = feature.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] Suggestion selected:", fullAddress, "Details:", props);
    
    const englishRegion = props.state || '';
    const spanishRegion = regionNameToSpanish[englishRegion] || englishRegion; // Fallback to original if not found

    onChange(fullAddress, {
      city: props.city || props.town || props.village || props.county || props.suburb || props.district || '',
      region: spanishRegion, // Use translated region
      country: props.country || '',
      lat: props.lat ?? feature.geometry?.coordinates[1],
      lng: props.lon ?? feature.geometry?.coordinates[0]
    });
    setSuggestions([]);
    setFetchError(null);
    setIsInputFocused(false); 
    if (inputRef.current) inputRef.current.blur();
  };

  const handleInputFocus = () => {
    console.log("[AddressAutocompleteInput] Input focused.");
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    console.log("[AddressAutocompleteInput] Input blurred.");
    // Delay hiding the dropdown to allow click events on suggestions to process
    setTimeout(() => {
      if (componentRootRef.current && !componentRootRef.current.contains(document.activeElement)) {
        setIsInputFocused(false);
      }
    }, 150);
  };
  
  // This derived state determines if the dropdown should be rendered and visible
  const shouldDisplayDropdown = isInputFocused && (
    apiKeyError != null ||
    fetchError != null ||
    isLoading ||
    (suggestions.length > 0 && inputValue.length >= 3) ||
    (inputValue.length > 0 && inputValue.length < 3) // For "type more" message
  );

  let commandListContent;
  if (apiKeyError) {
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal"><AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {apiKeyError}</CommandEmpty>;
  } else if (fetchError) {
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm text-destructive whitespace-normal"><AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5"/> {fetchError}</CommandEmpty>;
  } else if (isLoading && inputValue.length >= 3) {
    commandListContent = <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center"><Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />Buscando direcciones...</div>;
  } else if (suggestions.length > 0 && inputValue.length >=3) {
    commandListContent = (
      <CommandGroup heading={`${suggestions.length} sugerencia${suggestions.length > 1 ? 's' : ''}:`}>
        {suggestions.map((feature, index) => (
          <CommandItem
            key={feature.properties.place_id || `sugg-${index}-${Date.now()}`}
            value={feature.properties.formatted || feature.properties.address_line1 || feature.properties.name || `value-${index}`}
            onSelect={() => handleSelectSuggestion(feature)}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur before onSelect can fire
            className="cursor-pointer flex items-start gap-2.5 text-sm p-2.5 hover:bg-accent"
          >
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  } else if (isInputFocused && inputValue.length >= 3 && !isLoading) {
    commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm">No se encontraron resultados para "{inputValue}".</CommandEmpty>;
  } else if (isInputFocused && inputValue.length > 0 && inputValue.length < 3) {
     commandListContent = <CommandEmpty className="py-3 px-2.5 text-center text-sm">Escribe al menos 3 caracteres para buscar.</CommandEmpty>;
  } else {
    commandListContent = null;
  }
  
  console.log(`[AddressAutocompleteInput RENDER] inputValue: "${inputValue}", isLoading: ${isLoading}, fetchError: "${fetchError}", suggestions: ${suggestions.length}, shouldDisplayDropdown: ${shouldDisplayDropdown}, apiKeyError: ${apiKeyError}, isInputFocused: ${isInputFocused}`);

  return (
    <div ref={componentRootRef} className={cn("relative", className)}>
      <Command shouldFilter={false}> {/* CMDK's own filtering is not needed as we fetch */}
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
        {shouldDisplayDropdown && commandListContent && (
          <CommandList
            ref={dropdownListRef}
            className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
            style={{ display: 'block' }} 
          >
            {commandListContent}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
