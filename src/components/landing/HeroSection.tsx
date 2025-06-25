'use client';

import React from 'react';
import EditableText from '@/components/ui/EditableText';
import HeroSearchForm from './HeroSearchForm';

export default function HeroSection() {
  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <EditableText 
              id="landing:hero-subtitle" 
              textType="span" 
              className="inline-block text-primary font-semibold tracking-wide uppercase"
            >
              Encuentra tu próxima propiedad
            </EditableText>
            
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              <EditableText 
                id="landing:hero-title" 
                textType="span"
              >
                La forma más inteligente de encontrar tu hogar ideal
              </EditableText>
            </h1>
            
            <EditableText 
              id="landing:hero-description" 
              multiline={true}
              className="max-w-[800px] mx-auto text-muted-foreground md:text-xl"
            >
              Conectamos propiedades con personas. Publica tu propiedad o busca tu próximo hogar con nuestra plataforma inteligente que usa IA para encontrar las mejores coincidencias.
            </EditableText>
          </div>
          
          <div className="w-full max-w-5xl">
            <HeroSearchForm />
          </div>
        </div>
      </div>
    </section>
  );
} 