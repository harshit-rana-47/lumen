import { LandingExperience } from "@/components/landing/LandingExperience";

/**
 * Public marketing entry — cinematic landing (Slice B).
 * Authenticated users are redirected to /today by middleware.
 */
export default function LandingPage() {
  return <LandingExperience />;
}
