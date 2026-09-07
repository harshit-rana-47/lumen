"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Register GSAP plugins once. Import from client modules that need GSAP.
 * ScrollTrigger is used by Slice B landing choreography; do not attach heavy triggers in the editor.
 */
let registered = false;

export function ensureGsapPlugins(): void {
  if (registered || typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

ensureGsapPlugins();

export { gsap, useGSAP, ScrollTrigger };
