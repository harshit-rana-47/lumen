/**
 * Typography + surface class maps for the Lumen design system.
 */

export const typeClass = {
  displayXl: "lumen-display-xl",
  displayLg: "lumen-display-lg",
  display: "lumen-display",
  title: "lumen-title",
  bodyLg: "lumen-body-lg",
  body: "text-base leading-[var(--leading-body)]",
  caption: "lumen-caption",
  overline: "lumen-overline"
} as const;

export const surfaceClass = {
  paper: "lumen-paper",
  surface: "lumen-surface",
  quiet: "lumen-surface-quiet"
} as const;
