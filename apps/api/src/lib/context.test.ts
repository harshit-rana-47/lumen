function createSupabaseMock(pinnedBody: string | null) {
  const rpcResult = {
    returns: async () => ({ data: [], error: null })
  };

  return {
    rpc: jest.fn(() => rpcResult),
    from: jest.fn(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            is: () => ({
              maybeSingle: async () =>
                pinnedBody
                  ? {
                      data: {
                        id: "11111111-1111-1111-1111-111111111111",
                        title_encrypted: null,
                        body_encrypted: "cipher",
                        iv: null,
                        auth_tag: null,
                        entry_date: "2026-08-30"
                      },
                      error: null
                    }
                  : { data: null, error: null }
            }),
            in: () => ({
              returns: async () => ({ data: [], error: null })
            })
          }),
          is: () => ({
            order: () => ({
              order: () => ({
                limit: () => ({
                  neq: () => ({ returns: async () => ({ data: [], error: null }) }),
                  returns: async () => ({ data: [], error: null })
                })
              })
            })
          }),
          in: () => ({
            returns: async () => ({ data: [], error: null })
          })
        })
      })
    }))
  };
}

describe("context assembly modes", () => {
  it("treats pinnedEntryId as reflection mode", async () => {
    jest.resetModules();

    jest.doMock("../config/embeddings", () => ({
      embedText: jest.fn(async () => Array(384).fill(0))
    }));
    jest.doMock("../lib/userDEK", () => ({
      getUserDEK: jest.fn(
        async () => "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      )
    }));
    jest.doMock("../config/supabase", () => ({
      supabaseAdmin: createSupabaseMock("Pinned journal body about today")
    }));
    jest.doMock("../modules/journal/journal.encrypt", () => ({
      decryptOptionalText: () => null,
      decryptRequiredText: () => "Pinned journal body about today"
    }));

    const { buildSystemContext } = await import("../lib/context");
    const context = await buildSystemContext(
      "00000000-0000-0000-0000-000000000001",
      "What patterns do you see?",
      {
        mode: "reflection",
        pinnedEntryId: "11111111-1111-1111-1111-111111111111"
      }
    );

    expect(context).toContain("Mode: Reflect on this journal entry");
    expect(context).toContain("Pinned journal entry:");
    expect(context).toContain("Pinned journal body about today");
    expect(context).toContain("authoritative focus");
  });

  it("builds general mode without pinned entry section", async () => {
    jest.resetModules();

    jest.doMock("../config/embeddings", () => ({
      embedText: jest.fn(async () => Array(384).fill(0))
    }));
    jest.doMock("../lib/userDEK", () => ({
      getUserDEK: jest.fn(
        async () => "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      )
    }));
    jest.doMock("../config/supabase", () => ({
      supabaseAdmin: createSupabaseMock(null)
    }));
    jest.doMock("../modules/journal/journal.encrypt", () => ({
      decryptOptionalText: () => null,
      decryptRequiredText: () => ""
    }));

    const { buildSystemContext } = await import("../lib/context");
    const context = await buildSystemContext("00000000-0000-0000-0000-000000000001", "Hello");

    expect(context).toContain("Mode: General chat.");
    expect(context).not.toContain("Pinned journal entry:");
  });
});
