"use client";

import { useEffect, useState } from "react";

/**
 * Respects `prefers-reduced-motion: reduce`.
 * Callers should shorten distance / drop scroll-linked motion,
 * not strip the UI into a dead fallback.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}
