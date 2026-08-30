import { decrypt, encrypt, generateDEK } from "../lib/encrypt";

/**
 * Unit tests for memory supersession / confidence gating rules
 * (mirrors logic in workers/memory.worker.ts without hitting Groq/DB).
 */

const MIN_AI_CONFIDENCE = 0.55;

type Fact = { confidence: number; userEditedExisting?: boolean };

function shouldApplyAiFact(fact: Fact): "skip_confidence" | "skip_user_edited" | "apply" {
  if (fact.confidence < MIN_AI_CONFIDENCE) {
    return "skip_confidence";
  }

  if (fact.userEditedExisting) {
    return "skip_user_edited";
  }

  return "apply";
}

describe("memory confidence gating and user corrections", () => {
  it("drops low-confidence AI facts", () => {
    expect(shouldApplyAiFact({ confidence: 0.4 })).toBe("skip_confidence");
  });

  it("never overwrites user-edited memories", () => {
    expect(shouldApplyAiFact({ confidence: 0.9, userEditedExisting: true })).toBe("skip_user_edited");
  });

  it("applies high-confidence AI facts when not user-edited", () => {
    expect(shouldApplyAiFact({ confidence: 0.8, userEditedExisting: false })).toBe("apply");
  });

  it("round-trips encrypted memory values", () => {
    const dek = generateDEK();
    const payload = encrypt("User prefers morning journaling", dek);
    expect(decrypt(payload, dek)).toBe("User prefers morning journaling");
  });
});
