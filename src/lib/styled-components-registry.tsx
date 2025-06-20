// src/lib/styled-components-registry.tsx
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

// Define una lista de props que no deben pasarse a los elementos del DOM
// si son usadas por styled-components para lógica de estilo.
const commonStyledProps = new Set([
  'variant', 'color', 'bg', 'fontSize', 'fontWeight', 'fontFamily',
  'p', 'pt', 'pb', 'pl', 'pr', 'px', 'py',
  'm', 'mt', 'mb', 'ml', 'mr', 'mx', 'my',
  'width', 'height', 'size', // 'size' es común para íconos o botones
  'active', 'disabled', 'isLoading', // Props comunes de estado
  'error', 'success', 'warning', // Props de estado visual
  // Añade otras props personalizadas que sepas que usas solo para estilizar
  // como 'align', 'justify', 'direction', 'wrap', 'spacing', etc.
  'align', 'justify', 'direction', 'wrap', 'spacing', 'hoverColor', 'activeColor'
]);

const shouldForwardProp = (propName: string, target: any) => {
  if (typeof target === 'string') { // Solo aplicar a elementos HTML nativos
    // Filtrar props de styled-system y otras comunes que no son atributos HTML
    if (commonStyledProps.has(propName)) {
      return false;
    }
    // Permitir props que comienzan con `data-` o `aria-`
    if (propName.startsWith('data-') || propName.startsWith('aria-')) {
      return true;
    }
    // Evitar pasar props que son eventos (como onFocus, onClick) si empiezan con '$'
    // o si no son atributos HTML válidos (esto es más complejo de generalizar sin una lista completa)
    // El filtrado por `$` es una convención de styled-components para "transient props".
    return !propName.startsWith('$');
  }
  // Para componentes React (que no son strings), pasar todas las props por defecto.
  return true;
};


export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    // styledComponentsStyleSheet.instance.clearTag(); // This line is problematic and often not needed.
    return <>{styles}</>;
  })

  if (typeof window !== 'undefined') {
    // En el cliente, solo necesitamos el StyleSheetManager para `shouldForwardProp` si aún hay warnings
    return (
      <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        {children}
      </StyleSheetManager>
    );
  }

  // En el servidor, pasamos la instancia de la hoja de estilos
  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance} shouldForwardProp={shouldForwardProp}>
      {children}
    </StyleSheetManager>
  )
}
