import { createUserScopedClient, supabaseAdmin } from "../config/supabase";

describe("supabase access model", () => {
  it("exposes a service-role admin client", () => {
    expect(supabaseAdmin).toBeDefined();
  });

  it("creates a user-scoped client from a JWT", () => {
    const client = createUserScopedClient("test-access-token");
    expect(client).toBeDefined();
  });
});
