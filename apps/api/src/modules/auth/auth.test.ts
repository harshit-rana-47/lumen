import { loginSchema, registerSchema } from "./auth.schema";

describe("auth schemas", () => {
  it("accepts a valid register payload", () => {
    const parsed = registerSchema.parse({
      email: "person@example.com",
      password: "longenough",
      name: "Ada"
    });
    expect(parsed.email).toBe("person@example.com");
  });

  it("rejects a short password and invalid email", () => {
    expect(registerSchema.safeParse({ email: "nope", password: "short", name: "Ada" }).success).toBe(
      false
    );
    expect(loginSchema.safeParse({ email: "person@example.com", password: "" }).success).toBe(false);
  });
});
