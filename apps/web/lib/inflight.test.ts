import {
  forgetRemembered,
  forgetRememberedPrefix,
  getRemembered,
  rememberInflight,
  shareInflight
} from "./inflight";

describe("read cache", () => {
  it("hydrates immediately and does not rerun work while the TTL holds", async () => {
    let runs = 0;
    const first = await rememberInflight("test-key", 60_000, async () => {
      runs += 1;
      return 7;
    });
    const second = await rememberInflight("test-key", 60_000, async () => {
      runs += 1;
      return 8;
    });

    expect(first).toBe(7);
    expect(second).toBe(7);
    expect(runs).toBe(1);
    expect(getRemembered<number>("test-key")).toBe(7);

    forgetRemembered("test-key");
    expect(getRemembered<number>("test-key")).toBeUndefined();

    forgetRememberedPrefix("test-");
    await shareInflight("x", async () => 1);
  });
});
