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
  const commandListRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      const errorMsg = "Servicio de direcciones no disponible (Error de Configuración API GEOAPIFY).";
      console.error("[AddressAutocompleteInput CRITICAL] Geoapify API Key (NEXT_PUBLIC_GEOAPIFY_API_KEY) no está configurada.");
      setApiKeyError(errorMsg);
      setFetchError(errorMsg); // Mostrarlo también en el desplegable si se intenta usar
    } else {
      setApiKeyError(null);
    }
  }, []);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!GEOAPIFY_API_KEY) {
      // El error de API key ya se maneja en el useEffect inicial y se muestra.
      // No es necesario setear fetchError aquí de nuevo para eso.
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

    setIsLoading(true);
    setFetchError(null);
    setSuggestions([]); // Limpiar sugerencias anteriores antes de una nueva búsqueda

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:cl&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
    console.log(`[AddressAutocompleteInput] Fetching from Geoapify for: "${query}" URL: ${url}`);

    try {
      const response = await fetch(url, { method: 'GET' });
      const responseBodyText = await response.text();
      console.log(`[AddressAutocompleteInput] Geoapify API response for "${query}" - Status: ${response.status}`);

      if (!response.ok) {
        let errorDetail = `Error ${response.status} de Geoapify. `;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorDetail += errorData.message || errorData.error?.message || JSON.stringify(errorData.error) || response.statusText;
        } catch (parseErr) {
          errorDetail += `Respuesta no es JSON: ${responseBodyText.substring(0, 100)}`;
        }
        console.error("[AddressAutocompleteInput ERROR] Geoapify API error details:", errorDetail);
        throw new Error(errorDetail);
      }
      const data = JSON.parse(responseBodyText) as { features: GeoapifyFeature[] };
      console.log(`[AddressAutocompleteInput] Geoapify response data.features count: ${data?.features?.length}`);
      if (data && Array.isArray(data.features)) {
        setSuggestions(data.features);
        if (data.features.length === 0) {
            console.log("[AddressAutocompleteInput] Geoapify returned 0 features for query:", query);
        }
      } else {
        console.warn('[AddressAutocompleteInput WARN] Geoapify response "features" was not an array or data is null:', data);
        setSuggestions([]);
      }
    } catch (error: any) {
      console.error("[AddressAutocompleteInput ERROR] Error fetching/processing Geoapify suggestions:", error.message, error);
      setSuggestions([]);
      setFetchError(
        error.message.includes("Failed to fetch")
        ? "Error de red. No se pudo conectar al servicio de direcciones. Revisa tu conexión, VPN o extensiones del navegador."
        : (error.message || "No se pudieron cargar las sugerencias.")
      );
    } finally {
      setIsLoading(false);
      // Mantener el dropdown abierto si hay error o sugerencias (o si está cargando y luego da error)
      setShowSuggestionsDropdown(true);
    }
  }, []); // GEOAPIFY_API_KEY es constante de módulo, setters son estables.

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (inputValue && inputValue.length >= 3 && !disabled && !apiKeyError) {
      debounceTimeoutRef.current = setTimeout(() => fetchSuggestions(inputValue), 500);
    } else {
      setSuggestions([]);
      if (inputValue.length < 3 && !apiKeyError) { // Solo ocultar si no hay error de API Key
        setShowSuggestionsDropdown(false);
      }
      if (isLoading) setIsLoading(false); // Detener carga si el input se acorta
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [inputValue, fetchSuggestions, disabled, apiKeyError, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    onChange(newInputValue); // Propagar el valor sin procesar para la RHF y otros usos
    
    if (newInputValue.length >= 3 && !apiKeyError) {
      setFetchError(null); // Limpiar errores de fetch anteriores al empezar a escribir de nuevo
      setShowSuggestionsDropdown(true);
    } else if (newInputValue.length < 3) {
      setShowSuggestionsDropdown(false);
      setSuggestions([]);
      setFetchError(null);
      if (isLoading) setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: GeoapifyFeature) => {
    const props = suggestion.properties;
    const fullAddress = props.formatted || props.address_line1 || props.name || '';
    console.log("[AddressAutocompleteInput] Suggestion selected:", fullAddress, "Properties:", props);
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
    if (inputValue && inputValue.length >= 3 && !disabled && !apiKeyError) {
      setShowSuggestionsDropdown(true);
      if (!isLoading && suggestions.length === 0 && !fetchError) { // Si está vacío y sin error, intenta buscar
        fetchSuggestions(inputValue);
      }
    } else if (apiKeyError) {
      setShowSuggestionsDropdown(true); // Mostrar el error de API Key si existe
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Retrasar el cierre para permitir clics en las sugerencias
    setTimeout(() => {
      if (document.activeElement !== inputRef.current &&
          (!commandListRef.current || !commandListRef.current.contains(document.activeElement))) {
        setShowSuggestionsDropdown(false);
      }
    }, 150);
  };

  const shouldRenderCommandList = showSuggestionsDropdown && (inputValue.length >= 3 || fetchError || apiKeyError) && !disabled;

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
          disabled={disabled || !!apiKeyError}
          className="pl-10"
          aria-label="Dirección"
          autoComplete="off"
        />
        {(isLoading && inputValue.length >=3 && !apiKeyError && !fetchError) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {(fetchError && !isLoading && (apiKeyError || inputValue.length >=3)) && ( // Mostrar error si hay texto o error de API Key
            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" title={fetchError} />
        )}
      </div>

      {shouldRenderCommandList && (
        <CommandList
          ref={commandListRef}
          className="absolute z-[51] top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
          tabIndex={-1}
        >
          {isLoading && !fetchError ? ( // Mostrar carga solo si no hay error de fetch aún
            <div className="p-3 text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
              Buscando...
            </div>
          ) : fetchError ? ( // Mostrar error si existe (incluye apiKeyError)
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
                  tabIndex={0} // Hacerlo enfocable para teclado
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectSuggestion(feature); }}
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{feature.properties.formatted || feature.properties.address_line1 || feature.properties.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : ( // No cargando, sin error, pero 0 sugerencias
            <CommandEmpty className="py-3 px-2.5 text-center text-sm">
                No se encontraron resultados para "{inputValue}" en Chile.
            </CommandEmpty>
          )}
        </CommandList>
      )}
      {apiKeyError && !fetchError && !showSuggestionsDropdown && ( // Mostrar error de API Key si no hay otro error y el dropdown está cerrado
        <p className="text-xs text-destructive mt-1">
          <AlertTriangle className="inline-block h-3 w-3 mr-1"/> {apiKeyError}
        </p>
      )}
    </Command>
  );
}
