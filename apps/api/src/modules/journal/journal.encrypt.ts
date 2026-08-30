import { decrypt, encrypt, type EncryptedPayload } from "../../lib/encrypt";

type LegacyEncryptedColumns = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

export function parseEncryptedPayload(value: string, legacy?: LegacyEncryptedColumns): EncryptedPayload {
  try {
    return JSON.parse(value) as EncryptedPayload;
  } catch {
    if (!legacy) {
      throw new Error("Encrypted payload is not readable");
    }

    return legacy;
  }
}

export function encryptOptionalText(value: string | null | undefined, dek: string): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return serializeEncryptedPayload(encrypt(value, dek));
}

export function encryptRequiredText(value: string, dek: string): string {
  return serializeEncryptedPayload(encrypt(value, dek));
}

export function decryptOptionalText(value: string | null | undefined, dek: string): string | null {
  if (!value) {
    return null;
  }

  return decrypt(parseEncryptedPayload(value), dek);
}

export function decryptRequiredText(
  value: string,
  dek: string,
  legacy?: LegacyEncryptedColumns
): string {
  return decrypt(parseEncryptedPayload(value, legacy), dek);
}
