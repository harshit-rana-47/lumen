import Link from "next/link";

/**
 * Public marketing entry — cinematic expansion is a later Phase 2 slice.
 * Authenticated users are redirected to /today by middleware.
 */
export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsla(178,40%,88%,0.9),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsla(42,40%,92%,0.9),_transparent_50%)]"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl tracking-tight">Lumen</span>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-3 py-2 font-medium text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Begin
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[70dvh] w-full max-w-6xl flex-col justify-center px-6 pb-20 pt-10">
        <p className="text-sm tracking-[0.18em] text-foreground/50 uppercase">Private journaling</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Write freely.
          <br />
          Be understood.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/65 sm:text-lg">
          Lumen is a private AI journaling companion — remember what matters, reflect with care, and
          return to the page.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Start journaling
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-xl border border-border bg-[hsl(var(--surface))] px-6 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </main>
  );
}
