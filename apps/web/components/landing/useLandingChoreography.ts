"use client";

import { useLayoutEffect, type MutableRefObject, type RefObject } from "react";
import { ensureGsapPlugins, gsap, ScrollTrigger } from "@/lib/motion/gsap";

type Args = {
  rootRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null> | MutableRefObject<HTMLElement | null>;
  reduced: boolean;
};

/**
 * Lamp Circle choreography.
 * - Ambient light CSS vars scrub with page progress
 * - Desktop: pin notebook through Writing → Memory → Reflect → Chat
 * - Mobile: light still evolves with page scroll; chapters stack
 */
export function useLandingChoreography({ rootRef, stageRef, reduced }: Args) {
  useLayoutEffect(() => {
    ensureGsapPlugins();

    const root = rootRef.current;
    if (!root || reduced) {
      return;
    }

    const allowMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!allowMotion) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const stage = stageRef.current;

    const ctx = gsap.context(() => {
      const lightProxy = {
        intensity: 0.55,
        spread: 40,
        x: 64,
        y: 34,
        flame: 0.95
      };

      const applyLight = () => {
        root.style.setProperty("--light-intensity", String(lightProxy.intensity));
        root.style.setProperty("--light-spread", `${lightProxy.spread}%`);
        root.style.setProperty("--light-x", `${lightProxy.x}%`);
        root.style.setProperty("--light-y", `${lightProxy.y}%`);
        root.style.setProperty("--flame-scale", String(lightProxy.flame));
      };
      applyLight();

      // Arrival: light wakes
      gsap.to(lightProxy, {
        intensity: 0.78,
        spread: 50,
        flame: 1.08,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: applyLight
      });

      const heroBits = [
        root.querySelector("[data-hero-overline]"),
        root.querySelector("[data-hero-lede]"),
        root.querySelector("[data-hero-cta]"),
        root.querySelector("[data-hero-aside]")
      ].filter(Boolean);

      gsap.fromTo(
        heroBits,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.2,
          overwrite: "auto"
        }
      );

      // Whole-page light narrative (all breakpoints)
      gsap.to(lightProxy, {
        intensity: 0.78,
        spread: 52,
        x: 58,
        y: 42,
        flame: 1.1,
        ease: "none",
        onUpdate: applyLight,
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7
        }
      });

      if (!desktop || !stage) {
        return;
      }

      const pin = stage.querySelector<HTMLElement>("[data-landing-pin]");
      const notebook = stage.querySelector<HTMLElement>("[data-notebook]");
      const lamp = root.querySelector<HTMLElement>("[data-landing-lamp]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-notebook-line]", stage);
      const chips = gsap.utils.toArray<HTMLElement>("[data-memory-chip]", stage);
      const reflect = stage.querySelector<HTMLElement>("[data-reflect-panel]");
      const chat = stage.querySelector<HTMLElement>("[data-chat-layer]");
      const dear = stage.querySelector<HTMLElement>("[data-notebook-dear]");
      const copyWrite = stage.querySelector<HTMLElement>('[data-story-copy="write"]');
      const copyMemory = stage.querySelector<HTMLElement>('[data-story-copy="memory"]');
      const copyReflect = stage.querySelector<HTMLElement>('[data-story-copy="reflect"]');
      const copyChat = stage.querySelector<HTMLElement>('[data-story-copy="chat"]');

      if (!pin || !notebook || !reflect || !chat || lines.length === 0) {
        return;
      }

      gsap.set([copyMemory, copyReflect, copyChat].filter(Boolean), { autoAlpha: 0, y: 14 });
      gsap.set(copyWrite, { autoAlpha: 1, y: 0 });
      gsap.set(lines, { autoAlpha: 0, y: 10 });
      gsap.set(chips, { autoAlpha: 0, y: 16, scale: 0.94 });
      gsap.set(reflect, { autoAlpha: 0, xPercent: 110 });
      gsap.set(chat, { autoAlpha: 0, y: 18 });

      const chapterLight = { intensity: 0.7, spread: 48, x: 60, y: 40, flame: 1.05 };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "lumen-landing-story",
          trigger: pin,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 3.8)}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      // Sync chapter light into root vars
      tl.to(
        chapterLight,
        {
          intensity: 0.82,
          spread: 46,
          x: 56,
          y: 44,
          flame: 1.12,
          duration: 0.55,
          onUpdate: () => {
            lightProxy.intensity = chapterLight.intensity;
            lightProxy.spread = chapterLight.spread;
            lightProxy.x = chapterLight.x;
            lightProxy.y = chapterLight.y;
            lightProxy.flame = chapterLight.flame;
            applyLight();
          }
        },
        0
      );

      tl.to(lines, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.5 }, 0)
        .to(notebook, { scale: 1.02, duration: 0.5 }, 0)
        .to(lamp, { y: -8, duration: 0.5 }, 0)
        .addLabel("writeEnd", 0.65);

      // Memory — light softens into penumbra
      tl.to(
        chapterLight,
        {
          intensity: 0.68,
          spread: 58,
          x: 52,
          y: 46,
          flame: 0.98,
          duration: 0.8,
          onUpdate: () => {
            lightProxy.intensity = chapterLight.intensity;
            lightProxy.spread = chapterLight.spread;
            lightProxy.x = chapterLight.x;
            lightProxy.y = chapterLight.y;
            lightProxy.flame = chapterLight.flame;
            applyLight();
          }
        },
        "writeEnd"
      )
        .to(copyWrite, { autoAlpha: 0, y: -12, duration: 0.28 }, "writeEnd")
        .to(copyMemory, { autoAlpha: 1, y: 0, duration: 0.32 }, "writeEnd+=0.12")
        .to(lines, { autoAlpha: 0.3, duration: 0.4 }, "writeEnd")
        .to(chips, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.45 }, "writeEnd+=0.08")
        .to(dear, { autoAlpha: 0.55, duration: 0.35 }, "writeEnd")
        .addLabel("memoryEnd", "writeEnd+=0.85");

      // Reflect — companion enters the circle of light
      tl.to(
        chapterLight,
        {
          intensity: 0.88,
          spread: 44,
          x: 64,
          y: 42,
          flame: 1.15,
          duration: 0.85,
          onUpdate: () => {
            lightProxy.intensity = chapterLight.intensity;
            lightProxy.spread = chapterLight.spread;
            lightProxy.x = chapterLight.x;
            lightProxy.y = chapterLight.y;
            lightProxy.flame = chapterLight.flame;
            applyLight();
          }
        },
        "memoryEnd"
      )
        .to(copyMemory, { autoAlpha: 0, y: -12, duration: 0.28 }, "memoryEnd")
        .to(copyReflect, { autoAlpha: 1, y: 0, duration: 0.32 }, "memoryEnd+=0.12")
        .to(chips, { autoAlpha: 0, duration: 0.35 }, "memoryEnd")
        .to(lines, { autoAlpha: 0.2, duration: 0.35 }, "memoryEnd")
        .to(reflect, { autoAlpha: 1, xPercent: 0, duration: 0.5 }, "memoryEnd+=0.05")
        .to(notebook, { scale: 1, duration: 0.4 }, "memoryEnd")
        .addLabel("reflectEnd", "memoryEnd+=0.9");

      // Chat — widen the circle; page becomes conversation room
      tl.to(
        chapterLight,
        {
          intensity: 0.74,
          spread: 70,
          x: 50,
          y: 48,
          flame: 1.05,
          duration: 0.9,
          onUpdate: () => {
            lightProxy.intensity = chapterLight.intensity;
            lightProxy.spread = chapterLight.spread;
            lightProxy.x = chapterLight.x;
            lightProxy.y = chapterLight.y;
            lightProxy.flame = chapterLight.flame;
            applyLight();
          }
        },
        "reflectEnd"
      )
        .to(copyReflect, { autoAlpha: 0, y: -12, duration: 0.28 }, "reflectEnd")
        .to(copyChat, { autoAlpha: 1, y: 0, duration: 0.32 }, "reflectEnd+=0.12")
        .to(reflect, { autoAlpha: 0, xPercent: 24, duration: 0.35 }, "reflectEnd")
        .to([lines, dear], { autoAlpha: 0, duration: 0.28 }, "reflectEnd")
        .to(chat, { autoAlpha: 1, y: 0, duration: 0.45 }, "reflectEnd+=0.15")
        .to(
          notebook,
          {
            borderColor: "hsla(30, 20%, 28%, 0.5)",
            duration: 0.4
          },
          "reflectEnd"
        );

      stage.setAttribute("data-landing-choreography", "active");
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, root);

    return () => {
      stage?.removeAttribute("data-landing-choreography");
      ctx.revert();
      root.style.removeProperty("--light-intensity");
      root.style.removeProperty("--light-spread");
      root.style.removeProperty("--light-x");
      root.style.removeProperty("--light-y");
      root.style.removeProperty("--flame-scale");
    };
  }, [rootRef, stageRef, reduced]);
}
