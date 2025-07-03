'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SimplePropertyCardProps {
  title: string;
  price: number;
  imageUrl: string;
  code: string;
  groupName?: string;
}

export default function SimplePropertyCard({ title, price, imageUrl, code, groupName }: SimplePropertyCardProps) {
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
        
        {/* Botón de WhatsApp y Badge del grupo */}
        <div className="absolute bottom-2.5 right-2.5 flex space-x-2">
          {groupName && (
            <Badge className="text-xs px-2.5 py-1 shadow-md bg-blue-100 text-blue-700 rounded-md">
              {groupName}
            </Badge>
          )}
          <Badge className="text-xs px-2.5 py-1 shadow-md bg-green-500 text-white rounded-md">
            WhatsApp
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">{title}</h3>
        </div>
        <p className="text-xl font-bold">${price}</p>
      </div>
    </Card>
  );
} 