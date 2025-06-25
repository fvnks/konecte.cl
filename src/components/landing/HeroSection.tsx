'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import StaticText from '@/components/ui/StaticText';
import HeroSearchForm from './HeroSearchForm';
import { getEditableTextsByGroupAction } from '@/actions/editableTextActions';
import Link from 'next/link';

export default function HeroSection() {
  const [texts, setTexts] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function fetchTexts() {
      const fetchedTexts = await getEditableTextsByGroupAction('landing');
      setTexts(fetchedTexts);
    }
    fetchTexts();
  }, []);

  return (
    <section className="relative overflow-hidden pt-16 md:pt-20 pb-16">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight mb-4 text-foreground">
            <StaticText id="landing:hero-title" textType="span">
              Encuentra tu próximo hogar
            </StaticText>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            <StaticText id="landing:hero-subtitle" textType="span">
              La plataforma que conecta propietarios, corredores y compradores
            </StaticText>
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <HeroSearchForm />
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button asChild size="lg" variant="default" className="rounded-full">
            <Link href="/properties">
              <Search className="mr-2 h-5 w-5" />
              <StaticText id="landing:hero-search-button" textType="span">
                Buscar Propiedades
              </StaticText>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/requests">
              <StaticText id="landing:hero-requests-button" textType="span">
                Ver Solicitudes
              </StaticText>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
} 