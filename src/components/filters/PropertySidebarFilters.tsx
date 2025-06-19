// src/components/filters/PropertySidebarFilters.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Bath, ParkingCircle } from 'lucide-react'; // Considerar iconos

interface PropertySidebarFiltersProps {
  minBedrooms: string;
  setMinBedrooms: (value: string) => void;
  minBathrooms: string;
  setMinBathrooms: (value: string) => void;
  // Aquí se podrían añadir más props para otros filtros como estacionamiento, piscina, etc.
  // features: string[];
  // setFeatures: (features: string[]) => void;
}

export default function PropertySidebarFilters({
  minBedrooms,
  setMinBedrooms,
  minBathrooms,
  setMinBathrooms,
}: PropertySidebarFiltersProps) {
  return (
    <Card className="shadow-lg rounded-xl sticky top-24"> {/* sticky top para que se quede visible al hacer scroll */}
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">Filtros Adicionales</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        <div>
          <Label htmlFor="min-bedrooms" className="text-sm font-medium mb-1.5 flex items-center">
            <Home className="h-4 w-4 mr-2 text-primary" />
            Dormitorios (mín.)
          </Label>
          <Input
            id="min-bedrooms"
            type="number"
            min="0"
            placeholder="Ej: 2"
            value={minBedrooms}
            onChange={(e) => setMinBedrooms(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="min-bathrooms" className="text-sm font-medium mb-1.5 flex items-center">
            <Bath className="h-4 w-4 mr-2 text-primary" />
            Baños (mín.)
          </Label>
          <Input
            id="min-bathrooms"
            type="number"
            min="0"
            placeholder="Ej: 1"
            value={minBathrooms}
            onChange={(e) => setMinBathrooms(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Ejemplo de cómo se podría añadir un filtro para "Estacionamiento" (requeriría lógica adicional) */}
        {/*
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="has-parking"
            // checked={features.includes('Estacionamiento')}
            // onCheckedChange={(checked) => {
            //   const newFeatures = checked
            //     ? [...features, 'Estacionamiento']
            //     : features.filter(f => f !== 'Estacionamiento');
            //   setFeatures(newFeatures);
            // }}
          />
          <Label htmlFor="has-parking" className="text-sm font-medium flex items-center cursor-pointer">
            <ParkingCircle className="h-4 w-4 mr-2 text-primary" />
            Con Estacionamiento
          </Label>
        </div>
        */}
      </CardContent>
    </Card>
  );
}
