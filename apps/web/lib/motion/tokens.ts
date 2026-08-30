/**
 * Lumen motion + visual tokens — keep aligned with `app/globals.css`.
 * Art direction: private lamp / living notebook.
 */

export const motionDurations = {
  micro: 0.14,
  interaction: 0.24,
  transition: 0.4,
  cinematic: 0.85
} as const;

export const motionDurationsMs = {
  micro: 140,
  interaction: 240,
  transition: 400,
  cinematic: 850
} as const;

export const motionEase = {
  standard: "cubic-bezier(0.22, 1, 0.36, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  soft: "cubic-bezier(0.33, 1, 0.68, 1)",
  press: "cubic-bezier(0.3, 0, 0.2, 1)"
} as const;

export const gsapEase = {
  standard: "power3.out",
  emphasized: "power2.inOut",
  soft: "power2.out",
  press: "power2.inOut"
} as const;

export const motionDistance = {
  micro: 4,
  interaction: 8,
  transition: 16,
  cinematic: 32
} as const;

/** Stagger defaults (seconds) for list / message choreography */
export const motionStagger = {
  tight: 0.04,
  default: 0.06,
  loose: 0.1
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60
} as const;

export type MotionDurationKey = keyof typeof motionDurations;
