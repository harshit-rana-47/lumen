"use client";

import Link from "next/link";
import {
  ActiveIndicator,
  AmbientBackground,
  FadeReveal,
  FloatingElement,
  HoverLift,
  MagneticButton,
  MotionLink,
  PressFeedback,
  RevealText,
  ScaleReveal,
  ScrollReveal,
  SectionHeading,
  SlideReveal,
  SpringPress,
  StaggerReveal,
  ThinkingIndicator
} from "@/components/motion";
import { typeClass, surfaceClass } from "@/lib/design/typography";
import { cn } from "@/lib/cn";

/**
 * Slice A visual verification surface — not product IA.
 * Confirms tokens + primitives before landing (Slice B).
 */
export default function DesignSystemPage() {
  return (
    <AmbientBackground grain className="min-h-dvh text-ink" drift>
      <main className="relative mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-16 space-y-4">
          <p className={typeClass.overline}>Lumen · Slice A</p>
          <RevealText
            as="h1"
            text="Private lamp / living notebook"
            className={typeClass.displayLg}
          />
          <p className={cn(typeClass.bodyLg, "max-w-2xl text-ink-muted")}>
            Design system preview. Tokens, atmosphere, and motion primitives — no landing page yet.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <MagneticButton>
              <PressFeedback className="rounded-lumen-lg bg-lamp px-5 py-2.5 text-sm font-medium text-[hsl(var(--paper-elevated))] shadow-soft">
                Magnetic + press
              </PressFeedback>
            </MagneticButton>
            <SpringPress className="rounded-lumen-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink">
              Spring press
            </SpringPress>
            <MotionLink href="/">Back home</MotionLink>
          </div>
        </header>

        <section className="mb-20 grid gap-6 md:grid-cols-3">
          {[
            { title: "Paper", swatch: "bg-paper border border-line", note: "Page field" },
            { title: "Lamp", swatch: "bg-lamp", note: "Primary / focus" },
            { title: "Ember", swatch: "bg-ember", note: "Sparse accent" }
          ].map((item) => (
            <HoverLift key={item.title} className={cn(surfaceClass.surface, "p-5")}>
              <div className={cn("mb-4 h-16 rounded-lumen", item.swatch)} />
              <h2 className={typeClass.title}>{item.title}</h2>
              <p className={typeClass.caption}>{item.note}</p>
            </HoverLift>
          ))}
        </section>

        <ScrollReveal className="mb-20">
          <SectionHeading
            overline="Typography"
            title="Fraunces for voice. DM Sans for chrome."
            description="Display carries intimacy; body stays quiet so writing can dominate later surfaces."
          />
          <div className="mt-8 space-y-3">
            <p className={typeClass.display}>Display</p>
            <p className={typeClass.title}>Title</p>
            <p className={typeClass.bodyLg}>Body large — reflective supporting copy.</p>
            <p className={typeClass.caption}>Caption — metadata and quiet guidance.</p>
            <p className={typeClass.overline}>Overline label</p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-20">
          <SectionHeading overline="Motion" title="One physics system" />
          <StaggerReveal className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className={cn(surfaceClass.quiet, "p-4")}>
              <FadeReveal>
                <p className="text-sm font-medium">FadeReveal</p>
                <p className={typeClass.caption}>Entrances · hierarchy</p>
              </FadeReveal>
            </div>
            <div className={cn(surfaceClass.quiet, "p-4")}>
              <SlideReveal>
                <p className="text-sm font-medium">SlideReveal</p>
                <p className={typeClass.caption}>Structural continuity</p>
              </SlideReveal>
            </div>
            <div className={cn(surfaceClass.quiet, "p-4")}>
              <ScaleReveal>
                <p className="text-sm font-medium">ScaleReveal</p>
                <p className={typeClass.caption}>Companion surfaces</p>
              </ScaleReveal>
            </div>
            <div className={cn(surfaceClass.quiet, "relative overflow-hidden p-4")}>
              <ActiveIndicator className="!inset-auto left-0 top-0 h-full w-1 rounded-none bg-lamp/30" />
              <p className="relative text-sm font-medium">ActiveIndicator</p>
              <p className={cn("relative", typeClass.caption)}>Nav / selection</p>
            </div>
          </StaggerReveal>
          <div className="mt-6 flex items-center gap-4">
            <ThinkingIndicator />
            <span className={typeClass.caption}>ThinkingIndicator — AI alive, not a spinner</span>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <SectionHeading
            overline="Atmosphere"
            title="Light stays quiet"
            description="Wash + optional grain. Drift is near-imperceptible and respects reduced motion."
          />
          <FloatingElement enabled className="mt-8">
            <div className={cn(surfaceClass.surface, "p-6")}>
              <p className="font-display text-lg">FloatingElement (landing-only opt-in)</p>
              <p className={typeClass.caption}>Never near the journal editor.</p>
              <Link href="/login" className="mt-4 inline-block text-sm text-lamp">
                Auth will inherit this world in Slice C →
              </Link>
            </div>
          </FloatingElement>
        </ScrollReveal>
      </main>
    </AmbientBackground>
  );
}
