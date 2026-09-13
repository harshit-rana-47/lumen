describe("browser supabase client", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }
    if (previousKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
    }
    jest.resetModules();
  });

  it("imports without throwing so Next can prerender public routes", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    jest.resetModules();
    await expect(import("./supabase")).resolves.toMatchObject({
      getSupabase: expect.any(Function)
    });
  });

  it("creates the client when public env is present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    jest.resetModules();
    const { getSupabase } = await import("./supabase");
    expect(getSupabase()).toBeTruthy();
  });

  it("rejects a non-HTTPS Supabase URL in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    jest.resetModules();
    const { getSupabase } = await import("./supabase");
    expect(() => getSupabase()).toThrow(/HTTPS/);
  });
});
