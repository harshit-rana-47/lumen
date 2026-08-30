import { JournalWorkspace } from "@/components/journal/JournalWorkspace";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <JournalWorkspace>{children}</JournalWorkspace>;
}
