import { decrypt, encrypt, generateDEK } from "./encrypt";

describe("AES-256-GCM encryption", () => {
  it("encrypts and decrypts a round trip", () => {
    const dek = generateDEK();
    const encrypted = encrypt("private journal text", dek);

    expect(decrypt(encrypted, dek)).toBe("private journal text");
  });

  it("throws when authTag is tampered", () => {
    const dek = generateDEK();
    const encrypted = encrypt("private journal text", dek);

    expect(() =>
      decrypt(
        {
          ...encrypted,
          authTag: Buffer.alloc(16).toString("base64")
        },
        dek
      )
    ).toThrow();
  });

  it("uses a different IV for separate encryptions", () => {
    const dek = generateDEK();
    const first = encrypt("same plaintext", dek);
    const second = encrypt("same plaintext", dek);

    expect(first.iv).not.toBe(second.iv);
  });
});
