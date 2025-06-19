// src/lib/styled-components-registry.tsx
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

// Función para determinar si una prop debe ser pasada al DOM
// Filtra props comunes usadas para estilizar que no son atributos HTML válidos.
const shouldForwardProp = (propName: string, target: any) => {
  if (typeof target === 'string') { // Solo aplicar a elementos HTML nativos
    const invalidHTMLProps = new Set([
      'variant', 'color', 'bg', 'fontSize', 'fontWeight', 'fontFamily',
      'p', 'pt', 'pb', 'pl', 'pr', 'px', 'py',
      'm', 'mt', 'mb', 'ml', 'mr', 'mx', 'my',
      // Añade otras props personalizadas que uses para styled-components y no sean HTML
    ]);
    return !invalidHTMLProps.has(propName);
  }
  return true; // Para componentes React, pasar todas las props
};


export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    if (styledComponentsStyleSheet.instance && typeof (styledComponentsStyleSheet.instance as any).clearTag === 'function') {
        (styledComponentsStyleSheet.instance as any).clearTag();
    }
    return <>{styles}</>;
  })

  if (typeof window !== 'undefined') {
    return (
      <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        {children}
      </StyleSheetManager>
    )
  }

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance} shouldForwardProp={shouldForwardProp}>
      {children}
    </StyleSheetManager>
  )
}
