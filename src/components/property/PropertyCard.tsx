// This file's content is being merged into PropertyListItem.tsx
// to avoid duplication and confusion. This component will be deprecated.
// For now, it will re-export the primary list item component.

import PropertyListItem from './PropertyListItem';

export default PropertyListItem;

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PropertyCardProps {
  title: string;
  price: number;
  imageUrl: string;
  code: string;
  groupName?: string;
}

export default function PropertyCard({ title, price, imageUrl, code, groupName }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg rounded-xl w-full">
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl || 'https://placehold.co/320x240.png?text=Propiedad'}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Tipo de propiedad (Arriendo) */}
        <Badge className="absolute top-2.5 left-2.5 capitalize text-xs px-2.5 py-1 shadow-md bg-blue-500 text-white rounded-md">
          Arriendo
        </Badge>
        
        {/* Código de la propiedad */}
        <Badge className="absolute top-2.5 right-2.5 text-xs px-2.5 py-1 shadow-md bg-blue-500 text-white rounded-md">
          {code}
        </Badge>
        
        {/* Botón de WhatsApp */}
        <div className="absolute bottom-2.5 right-2.5">
          <Badge className="text-xs px-2.5 py-1 shadow-md bg-green-500 text-white rounded-md">
            WhatsApp
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">{title}</h3>
          {groupName && (
            <Badge className="text-xs py-0.5 px-2 font-normal bg-blue-100 text-blue-700 border-0">
              {groupName}
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold">${price}</p>
      </div>
    </Card>
  );
}
