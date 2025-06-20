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
    setHasMounted(true);
  }, []);

  return hasMounted;
}
