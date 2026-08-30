/**
 * Lumen motion tokens — keep in sync with CSS vars in `app/globals.css`.
 * Durations are starting points; pick by interaction weight.
 */

export const motionDurations = {
  micro: 0.14,
  interaction: 0.24,
  transition: 0.4,
  cinematic: 0.85
} as const;

/** Milliseconds for CSS / timeouts */
export const motionDurationsMs = {
  micro: 140,
  interaction: 240,
  transition: 400,
  cinematic: 850
} as const;

export const motionEase = {
  /** Entrances / settles */
  standard: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Presses / exits slightly snappier */
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  /** Soft landings */
  soft: "cubic-bezier(0.33, 1, 0.68, 1)"
} as const;

/** GSAP-friendly ease names mapped to token intent */
export const gsapEase = {
  standard: "power3.out",
  emphasized: "power2.inOut",
  soft: "power2.out"
} as const;

export const motionDistance = {
  micro: 4,
  interaction: 8,
  transition: 16,
  cinematic: 32
} as const;

export type MotionDurationKey = keyof typeof motionDurations;
