'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StaticTextProps {
  id: string;
  children?: React.ReactNode;
  textType?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  className?: string;
}

/**
 * Componente para mostrar texto estático.
 * Este componente reemplaza al antiguo EditableText pero sin la funcionalidad de edición.
 */
export default function StaticText({ 
  id, 
  children, 
  textType = 'p', 
  className 
}: StaticTextProps) {
  const Component = textType as keyof JSX.IntrinsicElements;
  
  return (
    <Component 
      className={cn(className)} 
      data-text-id={id}
    >
      {children}
    </Component>
  );
} 