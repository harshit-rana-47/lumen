import { parseTimeZoneHeader } from "./userTimeZone";

describe("parseTimeZoneHeader", () => {
  it("accepts a valid IANA zone from the client header", () => {
    expect(parseTimeZoneHeader("America/Los_Angeles")).toBe("America/Los_Angeles");
    expect(parseTimeZoneHeader(["Asia/Kolkata"])).toBe("Asia/Kolkata");
  });

  it("rejects missing or invalid values so the worker can stay on UTC", () => {
    expect(parseTimeZoneHeader(undefined)).toBeNull();
    expect(parseTimeZoneHeader("")).toBeNull();
    expect(parseTimeZoneHeader("Not/AZone")).toBeNull();
    expect(parseTimeZoneHeader("America/Los_Angeles; DROP TABLE")).toBeNull();
  });
});
