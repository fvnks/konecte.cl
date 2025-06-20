// src/hooks/useHasMounted.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook that returns true once the component has mounted on the client.
 * Useful for conditionally rendering client-side only components to avoid
 * hydration mismatches or issues with libraries that expect a browser environment.
 */
export default function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // We don't need setTimeout(0) here if we're dynamically importing
    // the component that uses DND. The dynamic import itself handles the
    // client-side rendering timing.
    setHasMounted(true);
  }, []);

  return hasMounted;
}
