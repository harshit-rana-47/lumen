import { journalPlainText, parseJournalBody, titleFromPlain } from "./journalDocument";

describe("journal document envelope (API copy)", () => {
  it("reads legacy plaintext as plain with empty lexical", () => {
    const parsed = parseJournalBody("Today I walked home.");
    expect(parsed.plain).toBe("Today I walked home.");
    expect(parsed.lexical).toBe("");
    expect(journalPlainText("Today I walked home.")).toBe("Today I walked home.");
  });

  it("parses versioned documents and ignores JSON that is not a document", () => {
    const stored = JSON.stringify({
      v: 1,
      lexical: '{"root":{}}',
      plain: "Hello",
      appearance: { paper: "linen", backgroundMediaId: "11111111-1111-1111-1111-111111111111" }
    });
    const parsed = parseJournalBody(stored);
    expect(parsed.plain).toBe("Hello");
    expect(parsed.lexical).toBe('{"root":{}}');
    expect(parsed.appearance?.paper).toBe("linen");
    expect(journalPlainText(stored)).toBe("Hello");
    expect(parseJournalBody('{"mood":"ok"}').plain).toBe('{"mood":"ok"}');
  });

  it("derives a title from the first line of plain text", () => {
    expect(titleFromPlain("Rain on the roof.\nLater I slept.")).toBe("Rain on the roof.");
    expect(titleFromPlain("   \n")).toBeNull();
  });
});
