// src/lib/styled-components-registry.tsx
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

// Lista de props comunes que son para lógica de estilo y no deben pasarse al DOM
const commonStyledProps = new Set([
  'variant', 'color', 'bg', 'fontSize', 'fontWeight', 'fontFamily',
  'p', 'pt', 'pb', 'pl', 'pr', 'px', 'py',
  'm', 'mt', 'mb', 'ml', 'mr', 'mx', 'my',
  'width', 'height', 'size', 
  'active', 'disabled', 'isLoading',
  'error', 'success', 'warning',
  'align', 'justify', 'direction', 'wrap', 'spacing', 
  'hoverColor', 'activeColor', 'focusColor',
  // Añade aquí otras props personalizadas si las usas extensivamente para estilos
  'isMobile', 'isOpen', 'isSticky', 'fixedHeight', 'asModal'
]);

const shouldForwardProp = (propName: string, target: any) => {
  if (typeof target === 'string') { // Solo aplicar a elementos HTML nativos
    if (commonStyledProps.has(propName)) {
      return false;
    }
    // Permitir props que comienzan con `data-` o `aria-`
    if (propName.startsWith('data-') || propName.startsWith('aria-')) {
      return true;
    }
    // Filtrar props transitorias de styled-components (que empiezan con '$')
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
    // La línea original `styledComponentsStyleSheet.instance.clearTag()`
    // puede causar problemas en algunas versiones/configuraciones y a menudo no es necesaria.
    // Si se elimina, puede que solucione algunos problemas de estilos en SSR con Fast Refresh.
    // Por ahora, la mantenemos comentada como en la versión anterior.
    // styledComponentsStyleSheet.instance.clearTag(); 
    return <>{styles}</>;
  })

  // En el cliente y servidor, usar StyleSheetManager con shouldForwardProp
  return (
    <StyleSheetManager 
      sheet={typeof window === 'undefined' ? styledComponentsStyleSheet.instance : undefined}
      shouldForwardProp={shouldForwardProp}
    >
      {children}
    </StyleSheetManager>
  )
}
