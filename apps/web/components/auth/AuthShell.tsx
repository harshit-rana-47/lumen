"use client";

/**
 * Quiet doorway into Lumen — Lamp Circle atmosphere without landing spectacle.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lumen-auth relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, hsl(var(--ember) / 0.18), transparent 58%), radial-gradient(ellipse 50% 40% at 85% 20%, hsl(var(--ember-core) / 0.08), transparent 50%), radial-gradient(ellipse 80% 60% at 50% 100%, hsl(24 20% 5%) 0%, transparent 55%)"
        }}
      />
      <div
        aria-hidden
        className="lumen-grain pointer-events-none absolute inset-0 opacity-[0.045]"
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
