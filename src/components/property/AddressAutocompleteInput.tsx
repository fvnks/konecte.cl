// src/components/property/AddressAutocompleteInput.tsx
'use client';

import React, { useEffect } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string, details?: { city?: string; country?: string; lat?: number; lng?: number }) => void;
  onAddressSelect?: (
    address: string,
    placeDetails?: google.maps.places.PlaceResult,
    latLng?: { lat: number; lng: number }
  ) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Ingresa la dirección...',
  className,
  disabled = false,
}: AddressAutocompleteInputProps) {
  const {
    ready,
    value: internalValue,
    suggestions: { status, data, loading: suggestionsLoading },
    setValue: setInternalValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'cl' }, // Restringir a Chile por defecto
    },
    debounce: 300,
    defaultValue: value, // Sincronizar con el valor inicial del formulario
  });

  // Sincronizar el valor interno del hook si el valor externo (del formulario) cambia
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value, false); // El false evita disparar la API de nuevo innecesariamente
    }
  }, [value, internalValue, setInternalValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange(e.target.value); // Actualizar el valor del formulario principal inmediatamente
  };

  const handleSelectSuggestion = async ({ description, place_id }: google.maps.places.PlaceResult) => {
    setInternalValue(description || '', false); // No disparar más requests
    clearSuggestions();
    onChange(description || ''); // Actualizar el formulario principal

    if (onAddressSelect || onChange) {
      try {
        const results = await getGeocode({ placeId: place_id });
        const { lat, lng } = await getLatLng(results[0]);
        
        // Extraer ciudad y país si es posible
        let city, country;
        results[0].address_components?.forEach(component => {
          if (component.types.includes("locality") || component.types.includes("administrative_area_level_3")) {
            city = component.long_name;
          }
          if (component.types.includes("country")) {
            country = component.long_name;
          }
        });

        if (onAddressSelect) {
            onAddressSelect(description || '', results[0], { lat, lng });
        }
        // Actualizar el campo principal y opcionalmente otros campos
        onChange(description || '', { city, country, lat, lng });

      } catch (error) {
        console.error("Error al obtener geocodificación: ", error);
        if (onAddressSelect) {
            onAddressSelect(description || '');
        }
      }
    }
  };
  
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY_HERE";

  if (isApiKeyMissing && typeof window !== 'undefined') {
      console.warn("Google Places API Key no configurada. El autocompletado de direcciones estará deshabilitado.");
      return (
        <div className={cn("space-y-1", className)}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || true}
                className="border-orange-400 focus-visible:ring-orange-500"
            />
            <p className="text-xs text-orange-600">
                Autocompletado de direcciones deshabilitado. Por favor, configure la API Key de Google Places.
            </p>
        </div>
      );
  }

  return (
    <Command shouldFilter={false} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <CommandInput
          value={internalValue}
          onValueChange={(search) => {
            setInternalValue(search);
            onChange(search); // Propagar cambio al formulario principal
          }}
          placeholder={placeholder}
          disabled={!ready || disabled}
          className="pl-10"
          aria-label="Dirección"
        />
        {(suggestionsLoading) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {status === 'OK' && data.length > 0 && (
        <CommandList className="absolute z-10 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          <CommandEmpty className={cn(suggestionsLoading ? "hidden" : "py-6 text-center text-sm")}>
            {suggestionsLoading ? "" : "No se encontraron resultados."}
          </CommandEmpty>
          <CommandGroup>
            {data.map((suggestion) => (
              <CommandItem
                key={suggestion.place_id}
                value={suggestion.description}
                onSelect={() => handleSelectSuggestion(suggestion)}
                className="cursor-pointer flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{suggestion.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
      {status !== 'OK' && status !== 'ZERO_RESULTS' && status !== '' && internalValue.length > 2 && !suggestionsLoading && (
         <div className="absolute z-10 top-full mt-1 w-full rounded-md border bg-popover shadow-md p-3">
            <p className="text-xs text-destructive">Error al cargar sugerencias: {status}. Verifica tu API Key y la conexión.</p>
         </div>
      )}
    </Command>
  );
}
