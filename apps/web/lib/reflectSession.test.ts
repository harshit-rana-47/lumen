import { entryIdFromReflectTitle, pickReflectSession, reflectSessionTitle } from "./reflectSession";

describe("reflectSession", () => {
  const entryId = "11111111-1111-4111-8111-111111111111";

  it("encodes and decodes the journal entry id in the session title", () => {
    expect(reflectSessionTitle(entryId)).toBe(`reflect:${entryId}`);
    expect(entryIdFromReflectTitle(reflectSessionTitle(entryId))).toBe(entryId);
    expect(entryIdFromReflectTitle("general chat")).toBeNull();
  });

  it("picks the newest reflection session for an entry and ignores others", () => {
    const picked = pickReflectSession(
      [
        {
          mode: "general",
          title: reflectSessionTitle(entryId),
          updated_at: "2026-09-07T12:00:00.000Z"
        },
        {
          mode: "reflection",
          title: reflectSessionTitle(entryId),
          updated_at: "2026-09-07T10:00:00.000Z"
        },
        {
          mode: "reflection",
          title: reflectSessionTitle(entryId),
          updated_at: "2026-09-07T11:00:00.000Z"
        },
        {
          mode: "reflection",
          title: reflectSessionTitle("22222222-2222-4222-8222-222222222222"),
          updated_at: "2026-09-07T13:00:00.000Z"
        }
      ],
      entryId
    );

    expect(picked?.updated_at).toBe("2026-09-07T11:00:00.000Z");
  });
});
