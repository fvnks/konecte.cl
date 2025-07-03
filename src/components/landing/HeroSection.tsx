'use client';

import React from 'react';
import HeroSearchForm from './HeroSearchForm';

const backgroundImages = [
  'https://www.bukmy.cl/img/1.jpg',
  'https://www.bukmy.cl/img/2.jpg',
  'https://www.bukmy.cl/img/3.jpg',
  'https://www.bukmy.cl/img/4.jpg',
  'https://www.bukmy.cl/img/5.jpg',
  'https://www.bukmy.cl/img/6.jpg',
  'https://www.bukmy.cl/img/7.jpg',
  'https://www.bukmy.cl/img/8.jpg',
];

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
}

export default function HeroSection({ title, subtitle }: HeroSectionProps) {
  const [bgImage, setBgImage] = React.useState('');

  React.useEffect(() => {
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    setBgImage(randomImage);
  }, []);

  return (
    <section 
      className="relative overflow-hidden min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat pt-20"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight mb-6 text-white text-shadow">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-6 text-shadow">
            {subtitle}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <HeroSearchForm />
        </div>

        {/* Botón de WhatsApp en la posición de los botones de búsqueda */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <a 
            href="https://wa.me/56946725640?text=Hola,%20quiero%20publicar%20o%20buscar%20con%20el%20bot." 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg bg-[#25D366] hover:bg-[#20BD5C]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Publica y busca con WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
} 