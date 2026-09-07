import { Suspense } from "react";
import { JournalWorkspace } from "@/components/journal/JournalWorkspace";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  // JournalWorkspace reads ?date= via useSearchParams, which needs a boundary.
  return (
    <Suspense fallback={null}>
      <JournalWorkspace>{children}</JournalWorkspace>
    </Suspense>
  );
}
