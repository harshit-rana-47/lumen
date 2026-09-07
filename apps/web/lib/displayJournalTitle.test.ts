import { displayJournalTitle } from "./journalTitle";

describe("displayJournalTitle", () => {
  it("keeps a user-provided title", () => {
    expect(
      displayJournalTitle({
        title: "Trip notes",
        plainPreview: "We took the late train.",
        entryDate: "2026-09-04"
      })
    ).toBe("Trip notes");
  });

  it("falls back to content when the title is empty", () => {
    expect(
      displayJournalTitle({
        title: "  ",
        plainPreview: "Something I realized after dinner.",
        entryDate: "2026-09-04"
      })
    ).toBe("Something I realized after dinner.");
  });

  it("falls back to the entry date when there is no content", () => {
    const title = displayJournalTitle({
      title: null,
      plainPreview: null,
      entryDate: "2026-09-04"
    });
    expect(title).toMatch(/September/);
    expect(title).toMatch(/2026/);
    expect(title).not.toMatch(/untitled/i);
  });
});
