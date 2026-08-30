"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Register GSAP plugins once for the web app.
 * Import this from the root client layout / shell.
 */
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
