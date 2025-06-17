// src/components/ui/AnimatedLinkButton.tsx
'use client';

import Link from 'next/link';
import React from 'react';

interface AnimatedLinkButtonProps {
  href: string;
  textNormal: string;
  textHover: string;
  className?: string;
}

const AnimatedLinkButton: React.FC<AnimatedLinkButtonProps> = ({
  href,
  textNormal,
  textHover,
  className,
}) => {
  return (
    <Link href={href} passHref legacyBehavior>
      <a
        className={`
          overflow-hidden relative w-48 p-2 h-12 bg-black text-white border-none 
          rounded-md text-lg font-bold cursor-pointer z-10 group
          flex items-center justify-center text-center
          ${className || ''}
        `}
      >
        {/* Texto Normal - se oculta en hover */}
        <span className="transition-opacity duration-100 group-hover:opacity-0">
          {textNormal}
        </span>

        {/* Spans para animación de fondo */}
        <span className="absolute w-[150%] h-[200%] -top-8 -left-4 bg-green-200 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom z-[-1]" />
        <span className="absolute w-[150%] h-[200%] -top-8 -left-4 bg-green-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom z-[-1]" />
        <span className="absolute w-[150%] h-[200%] -top-8 -left-4 bg-green-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom z-[-1]" />

        {/* Texto Hover - se muestra en hover */}
        <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000 group-hover:opacity-100 opacity-0 z-20">
          {textHover}
        </span>
      </a>
    </Link>
  );
};

export default AnimatedLinkButton;
