import { titleFromPlain } from "@lumen/shared";

describe("titleFromPlain", () => {
  it("uses the first sentence when the line is long enough", () => {
    expect(
      titleFromPlain("I walked home in the rain. Then I made tea and sat by the window.")
    ).toBe("I walked home in the rain.");
  });

  it("uses the first non-empty line and does not invent words", () => {
    expect(titleFromPlain("\n\nMorning thoughts\nSomething I realized")).toBe("Morning thoughts");
  });

  it("preserves short user content instead of replacing it", () => {
    expect(titleFromPlain("checking")).toBe("checking");
  });

  it("returns null when there is no readable text", () => {
    expect(titleFromPlain("   \n\t  ")).toBeNull();
  });

  it("truncates on a word boundary", () => {
    const title = titleFromPlain(
      "Today I kept returning to the same unfinished conversation and could not put it down even after midnight arrived",
      40
    );
    expect(title).toBeTruthy();
    expect(title!.length).toBeLessThanOrEqual(40);
    expect(title).not.toMatch(/\s$/);
  });
});
