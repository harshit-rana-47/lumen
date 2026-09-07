import { journalLeafClassName, PAPER_CHOICES } from "./journalAppearance";

describe("journal appearance", () => {
  it("exposes the four paper styles", () => {
    expect(PAPER_CHOICES.map((choice) => choice.id)).toEqual(["parchment", "linen", "dusk", "night"]);
  });

  it("applies the selected paper class", () => {
    expect(journalLeafClassName({ paper: "linen" })).toContain("journal-leaf--linen");
    expect(journalLeafClassName({ paper: "dusk" })).toContain("journal-leaf--dusk");
    expect(journalLeafClassName({ paper: "night" })).toContain("journal-leaf--night");
    expect(journalLeafClassName({ paper: "parchment" })).toContain("journal-leaf--parchment");
  });

  it("marks a background picture without dropping the paper class", () => {
    const className = journalLeafClassName({
      paper: "dusk",
      backgroundMediaId: "media-1"
    });
    expect(className).toContain("journal-leaf--dusk");
    expect(className).toContain("journal-leaf--photo");
  });

  it("defaults to parchment when appearance is missing", () => {
    expect(journalLeafClassName()).toContain("journal-leaf--parchment");
    expect(journalLeafClassName()).not.toContain("journal-leaf--photo");
  });
});
