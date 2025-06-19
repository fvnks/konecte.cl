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
  'width', 'height', // A veces usadas para lógica condicional en styled-components
  'active', 'disabled', 'isLoading', // Props comunes de estado
  // Añade otras props personalizadas que sepas que usas solo para estilizar
]);

const shouldForwardProp = (propName: string, target: any) => {
  if (typeof target === 'string') { // Solo aplicar a elementos HTML nativos
    return !commonStyledProps.has(propName) && !propName.startsWith('$');
  }
  return true; // Para componentes React, pasar todas las props por defecto
};


export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    // Se eliminó la línea problemática que causaba error con `clearTag`.
    // styledComponentsStyleSheet.instance.clearTag(); // Esta línea puede causar errores si `clearTag` no existe o es llamado incorrectamente.
    // Para versiones más recientes de styled-components, la limpieza es automática o no necesaria de esta forma.
    // Si encuentras problemas de memoria o estilos duplicados en producción,
    // investiga la API actual de styled-components para ServerStyleSheet.
    return <>{styles}</>;
  })

  // Para el cliente, usar StyleSheetManager con shouldForwardProp.
  // Para el servidor, también es importante pasarlo si se realiza SSR con styled-components.
  return (
    <StyleSheetManager 
      sheet={typeof window !== 'undefined' ? undefined : styledComponentsStyleSheet.instance}
      shouldForwardProp={shouldForwardProp}
    >
      {children}
    </StyleSheetManager>
  )
}
