import { alignFromElementFormat, EMPTY_TOOLBAR_STATE } from "./toolbarState";

describe("toolbar format helpers", () => {
  it("treats empty, start, and left as left alignment", () => {
    expect(alignFromElementFormat("")).toBe("left");
    expect(alignFromElementFormat("left")).toBe("left");
    expect(alignFromElementFormat("start")).toBe("left");
  });

  it("maps center and right-side formats", () => {
    expect(alignFromElementFormat("center")).toBe("center");
    expect(alignFromElementFormat("right")).toBe("right");
    expect(alignFromElementFormat("end")).toBe("right");
  });

  it("starts with inactive inline and block tools", () => {
    expect(EMPTY_TOOLBAR_STATE.bold).toBe(false);
    expect(EMPTY_TOOLBAR_STATE.heading).toBeNull();
    expect(EMPTY_TOOLBAR_STATE.list).toBeNull();
    expect(EMPTY_TOOLBAR_STATE.align).toBe("left");
  });
});
