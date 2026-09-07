import { healthReadyUrl } from "./apiReadiness";

describe("healthReadyUrl", () => {
  it("uses the process-level /health/ready path, not the versioned API prefix", () => {
    expect(healthReadyUrl("http://localhost:4000/api/v1")).toBe("http://localhost:4000/health/ready");
    expect(healthReadyUrl("http://localhost:4000/api/v1/")).toBe("http://localhost:4000/health/ready");
  });
});
