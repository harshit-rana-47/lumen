import {
  entryIdFromReflectTitle,
  reflectSessionTitle,
  resolveReflectionPinnedEntryId
} from "./reflectSession";

describe("reflectSession", () => {
  const entryId = "11111111-1111-4111-8111-111111111111";

  it("only decodes UUID titles", () => {
    expect(entryIdFromReflectTitle(reflectSessionTitle(entryId))).toBe(entryId);
    expect(entryIdFromReflectTitle("reflect:not-a-uuid")).toBeNull();
  });

  it("prefers the session title over a client-supplied pin", () => {
    const other = "22222222-2222-4222-8222-222222222222";
    expect(resolveReflectionPinnedEntryId(reflectSessionTitle(entryId), other)).toBe(entryId);
    expect(resolveReflectionPinnedEntryId(null, other)).toBe(other);
  });
});
