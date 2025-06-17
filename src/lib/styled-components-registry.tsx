// src/lib/styled-components-registry.tsx
'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    // ClearAn tags to prevent memory leaks:
    // `styledComponentsStyleSheet.instance.clearTag()` not available on `ServerStyleSheet`
    // `clearTag` is a method of `StyleSheet` which is part of `styledComponentsStyleSheet.instance`
    // However, the primary goal is to avoid re-injecting styles.
    // The `ServerStyleSheet`'s `getStyleElement` is designed for SSR and should handle this.
    // For safety and to follow common patterns, we might manually clear if issues persist,
    // but often the instance itself handles its state across extractions.
    // If `styledComponentsStyleSheet.instance.clearTag()` were directly on ServerStyleSheet, it would be used.
    // Let's assume the current pattern is sufficient for now based on Next.js examples.
    // The key is `getStyleElement()` extracts the styles and effectively prepares the sheet for potential further use
    // or disposal. If `clearTag` is crucial on the instance for this pattern, it would be:
    // `styledComponentsStyleSheet.instance.clearTag()` - this depends on styled-components version and specific API.
    // Given the context, simply returning the styles is the primary action.
    // A typical clearTag would be `styledComponentsStyleSheet.instance.clearTag()` if the `instance` is the StyleSheet.
    // The provided code in Next.js docs usually implies `sheet.instance.clearTag()`. Let's assume this is correct for the version in use.
    
    // Re-checking the `ServerStyleSheet` API: it seems it doesn't directly expose `clearTag` on the sheet instance itself for typical useServerInsertedHTML.
    // The crucial part is extracting the styles. The sheet instance is managed.
    // The `seal()` method might be relevant if we were done with the sheet, but here we just extract.

    // For robust cleanup, one might do:
    // const styles = styledComponentsStyleSheet.getStyleElement();
    // (styledComponentsStyleSheet.instance as any)._alreadySealed = false; // Hacky, avoid
    // styledComponentsStyleSheet.instance.clearTag(); // If `instance` is a `StyleSheet` instance
    // For now, let's stick to the simple extraction as per basic Next.js patterns.
    // The main goal is to get the styles to the client.
    // If memory leaks or style duplication occurs, `clearTag` would be investigated.
    // The official Next.js example for App Router:
    // https://github.com/vercel/next.js/blob/canary/examples/with-styled-components/app/registry.tsx
    // uses `styledComponentsStyleSheet.instance.clearTag()`
    if (styledComponentsStyleSheet.instance && typeof (styledComponentsStyleSheet.instance as any).clearTag === 'function') {
        (styledComponentsStyleSheet.instance as any).clearTag();
    }
    return <>{styles}</>;
  })

  if (typeof window !== 'undefined') return <>{children}</>

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  )
}
