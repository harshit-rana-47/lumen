import { resolveExportApiBaseUrl } from "./exportApiBase";

describe("export API base URL", () => {
  it("keeps the hosted Render origin unchanged", () => {
    expect(resolveExportApiBaseUrl("https://lumen-api-nk77.onrender.com/api/v1")).toBe(
      "https://lumen-api-nk77.onrender.com/api/v1"
    );
  });

  it("uses IPv4 loopback so the local Next proxy can reach Express", () => {
    expect(resolveExportApiBaseUrl("http://localhost:4000/api/v1")).toBe("http://127.0.0.1:4000/api/v1");
  });

  it("returns null when the public API URL is missing", () => {
    expect(resolveExportApiBaseUrl(undefined)).toBeNull();
    expect(resolveExportApiBaseUrl("  ")).toBeNull();
  });
});
