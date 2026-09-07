"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { RevealText } from "@/components/motion/RevealText";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";
import { useLandingChoreography } from "@/components/landing/useLandingChoreography";
import "@/components/landing/landing.css";

const STORY_CHAPTERS = [
  {
    key: "write",
    overline: "Journal",
    title: "This is where you write.",
    body: "Write freely about your thoughts and experiences. Lumen can then help you explore what you’ve written — without turning the page into a form."
  },
  {
    key: "memory",
    overline: "Memory",
    title: "Context from earlier entries.",
    body: "Unlike a notes app, Lumen can use relevant details from previous journal entries so Chat and Reflect stay connected to what you’ve actually written."
  },
  {
    key: "reflect",
    overline: "Reflect",
    title: "Look closely at one entry.",
    body: "Open a journal entry and start Reflect. The conversation begins with that entry, and can still use broader journal context when it helps."
  },
  {
    key: "chat",
    overline: "Chat",
    title: "Talk across your journal.",
    body: "General Chat is a wider conversation with Lumen, based on accumulated context from your journaling — not pinned to a single entry."
  }
] as const;

/**
 * Immersive public landing — Slice B redesign.
 * Concept: “The Lamp Circle” — private chamber lit by a desk lamp over a living notebook.
 */
export function LandingExperience() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  useLandingChoreography({ rootRef, stageRef, reduced });

  useEffect(() => {
    document.documentElement.classList.add("lumen-landing-active");
    return () => document.documentElement.classList.remove("lumen-landing-active");
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("lumen-landing min-h-dvh", reduced && "lumen-landing--reduced")}
      data-landing-root
    >
      <LandingEnvironment />
      <div className="landing-shell">
        <LandingNav />
        <HeroSection />
        <EssenceSection />

        {reduced ? (
          <StaticStoryStack />
        ) : (
          <section
            ref={stageRef as RefObject<HTMLElement>}
            aria-label="How Lumen works"
            className="relative"
            data-landing-stage
          >
            <div className="landing-story-pin" data-landing-pin>
              <div className="landing-story-frame">
                <StoryCopyRail />
                <NotebookStage />
              </div>
            </div>
            <MobileStoryStack />
          </section>
        )}

        <PrivacySection />
        <FinalCta />
        <LandingFooter />
      </div>
    </div>
  );
}

function LandingEnvironment() {
  return (
    <div className="landing-env" aria-hidden data-landing-env>
      <div className="landing-env__void" />
      <div className="landing-env__glow" data-landing-glow />
      <div className="landing-env__desk" data-landing-desk />
      <div className="landing-lamp" data-landing-lamp>
        <div className="landing-lamp__arm" />
        <div className="landing-lamp__shade" />
        <div className="landing-lamp__bulb" />
        <div className="landing-lamp__flame" data-landing-flame />
      </div>
      <div className="landing-env__vignette" />
      <div className="landing-env__grain" />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="landing-nav relative z-[2]">
      <span className="landing-nav__brand">Lumen</span>
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Account">
        <Link href="/login" className="landing-nav__link">
          Log in
        </Link>
        <MagneticButton>
          <Link href="/register" className="landing-nav__cta">
            Start journaling
          </Link>
        </MagneticButton>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="landing-hero relative z-[2]">
      <p className="landing-overline mb-5" data-hero-overline>
        Private AI journaling companion
      </p>
      <RevealText
        as="h1"
        text="A private space to write, reflect, and understand your thoughts."
        className="landing-display-xl"
      />
      <p className="landing-lede" data-hero-lede>
        Lumen is an AI journaling companion. Write about your days, notice patterns over time, look closely
        at one entry, or have a broader conversation based on what you’ve already written.
      </p>
      <div className="landing-cta-row" data-hero-cta>
        <MagneticButton>
          <Link href="/register" className="landing-btn-primary">
            Start journaling
          </Link>
        </MagneticButton>
        <Link href="/login" className="landing-btn-ghost">
          I already have an account
        </Link>
      </div>
      <p className="landing-caption" data-hero-aside>
        A journal first. Not a productivity board, and not a public feed.
      </p>
    </section>
  );
}

function EssenceSection() {
  return (
    <section className="landing-essence relative z-[2]">
      <ScrollReveal>
        <div className="landing-essence__inner">
          <p className="landing-overline">What Lumen is</p>
          <h2 className="landing-display-lg">An AI journaling companion.</h2>
          <p className="landing-body">
            Write in your journal. Lumen keeps track of what you’ve saved, uses relevant past context when
            you talk, and keeps Journal, Reflect, and Chat as distinct ways to work with the same writing.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}

function StoryCopyRail() {
  return (
    <div className="landing-copy-rail">
      {STORY_CHAPTERS.map((chapter, index) => (
        <article
          key={chapter.key}
          data-story-copy={chapter.key}
          className={cn("space-y-3", index === 0 ? "opacity-100" : "opacity-0")}
        >
          <p className="landing-overline">{chapter.overline}</p>
          <h2 className="landing-display">{chapter.title}</h2>
          <p className="landing-body !mt-3">{chapter.body}</p>
        </article>
      ))}
    </div>
  );
}

function NotebookStage() {
  return (
    <div className="landing-notebook" data-notebook-stage>
      <div data-notebook className="landing-notebook__page">
        <div className="landing-notebook__rule" aria-hidden data-notebook-rule />
        <div className="landing-notebook__inner">
          <p className="landing-notebook__dear" data-notebook-dear>
            Dear Diary,
          </p>

          <div className="mt-6 space-y-3" data-notebook-lines aria-hidden>
            {[
              "I keep thinking about how tired I’ve been after work.",
              "I’m not sure if it’s the hours, or that I never really stop.",
              "Writing it down makes the pattern easier to see."
            ].map((line) => (
              <p key={line} data-notebook-line className="landing-notebook__line opacity-0">
                {line}
              </p>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0" data-memory-layer aria-hidden>
            {["new job in June", "wants more rest", "sister in Portland"].map((label, i) => (
              <span
                key={label}
                data-memory-chip
                className="landing-memory-chip opacity-0"
                style={{
                  left: `${16 + i * 22}%`,
                  top: `${44 + i * 11}%`
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <aside
            data-reflect-panel
            className="landing-reflect-panel translate-x-[110%] opacity-0"
            aria-hidden
          >
            <p className="landing-overline">Reflect</p>
            <p>What felt heaviest in this entry?</p>
            <p>Starts from the entry you opened.</p>
          </aside>

          <div data-chat-layer className="landing-chat-layer translate-y-6 opacity-0" aria-hidden>
            <p className="landing-overline text-center" style={{ color: "hsl(var(--ember))" }}>
              General Chat
            </p>
            <div className="landing-chat-bubble landing-chat-bubble--ask">
              What have I been writing about lately?
            </div>
            <div className="landing-chat-bubble landing-chat-bubble--answer">
              Work fatigue shows up across several recent entries.
            </div>
            <p
              className="text-center text-[0.65rem] uppercase tracking-[0.14em]"
              style={{ color: "hsl(var(--ivory-faint))" }}
            >
              Uses your journal as a whole
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileStoryStack() {
  return (
    <div className="landing-mobile-stack relative z-[2]">
      {STORY_CHAPTERS.map((chapter) => (
        <ScrollReveal key={chapter.key}>
          <article>
            <p className="landing-overline">{chapter.overline}</p>
            <h2 className="landing-display mt-3">{chapter.title}</h2>
            <p className="landing-body">{chapter.body}</p>
            <MobileChapterCard kind={chapter.key} />
          </article>
        </ScrollReveal>
      ))}
    </div>
  );
}

function StaticStoryStack() {
  return (
    <section aria-label="How Lumen works" className="landing-static-stack relative z-[2]">
      {STORY_CHAPTERS.map((chapter) => (
        <article key={chapter.key}>
          <p className="landing-overline">{chapter.overline}</p>
          <h2 className="landing-display mt-3">{chapter.title}</h2>
          <p className="landing-body">{chapter.body}</p>
          <MobileChapterCard kind={chapter.key} />
        </article>
      ))}
    </section>
  );
}

function MobileChapterCard({ kind }: { kind: (typeof STORY_CHAPTERS)[number]["key"] }) {
  return (
    <div className="landing-mobile-card">
      {kind === "write" && (
        <>
          <p className="font-display text-xl">Dear Diary,</p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "hsl(var(--ink-on-page-muted))" }}>
            Writing it down makes the pattern easier to see.
          </p>
        </>
      )}
      {kind === "memory" && (
        <div className="flex flex-wrap gap-2">
          {["new job in June", "wants more rest", "sister in Portland"].map((t) => (
            <span key={t} className="landing-memory-chip !static">
              {t}
            </span>
          ))}
        </div>
      )}
      {kind === "reflect" && (
        <div className="space-y-2 rounded-lg bg-[hsl(24_22%_10%)] p-4 text-[hsl(var(--ivory))]">
          <p className="landing-overline">Pinned entry</p>
          <p className="font-display text-lg leading-snug">
            What felt heaviest in this entry?
          </p>
        </div>
      )}
      {kind === "chat" && (
        <div className="space-y-2">
          <div className="landing-chat-bubble landing-chat-bubble--ask">What have I been writing about lately?</div>
          <div className="landing-chat-bubble landing-chat-bubble--answer ml-4">
            Work fatigue shows up across several recent entries.
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacySection() {
  return (
    <section className="landing-privacy relative z-[2]">
      <ScrollReveal>
        <div className="landing-privacy__inner">
          <p className="landing-overline">Privacy</p>
          <h2 className="landing-display-lg">Private to your account — not a public feed.</h2>
          <p className="landing-body mx-auto">
            Journal entries and conversations are encrypted at rest and scoped to your account. To answer in
            Chat and Reflect, Lumen reads relevant writing you have saved. You choose which memory categories
            can be extracted, and you can export or delete your data.
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="landing-finale relative z-[2]">
      <ScrollReveal>
        <div className="landing-finale__inner">
          <h2 className="landing-display">Start journaling.</h2>
          <p className="landing-body mx-auto">
            Create an account and write your first entry.
          </p>
          <div className="landing-cta-row justify-center">
            <MagneticButton>
              <Link href="/register" className="landing-btn-primary">
                Create your journal
              </Link>
            </MagneticButton>
            <Link href="/login" className="landing-nav__link">
              Log in
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-footer relative z-[2]">
      <div className="landing-footer__inner">
        <span className="landing-footer__brand">Lumen</span>
        <p>AI journaling companion</p>
      </div>
    </footer>
  );
}
