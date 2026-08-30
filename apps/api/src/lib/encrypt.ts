import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export type EncryptedPayload = {
  iv: string;
  authTag: string;
  ciphertext: string;
};

type EncryptionKey = Buffer | string;

function keyFromHex(value: string): Buffer {
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("Encryption key must be a 64 character hex string");
  }

  return Buffer.from(value, "hex");
}

function normalizeKey(key: EncryptionKey): Buffer {
  const normalized = Buffer.isBuffer(key) ? key : keyFromHex(key);

  if (normalized.length !== KEY_BYTES) {
    throw new Error("Encryption key must be 32 bytes");
  }

  return normalized;
}

function masterKey(): Buffer {
  return keyFromHex(env.MASTER_ENCRYPTION_KEY);
}

export function generateDEK(): string {
  return randomBytes(KEY_BYTES).toString("hex");
}

export function encrypt(plaintext: string, key: EncryptionKey): EncryptedPayload {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, normalizeKey(key), iv, {
    authTagLength: AUTH_TAG_BYTES
  });

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

export function decrypt(payload: EncryptedPayload, key: EncryptionKey): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    normalizeKey(key),
    Buffer.from(payload.iv, "base64"),
    {
      authTagLength: AUTH_TAG_BYTES
    }
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function wrapDEK(dek: EncryptionKey): EncryptedPayload {
  return encrypt(normalizeKey(dek).toString("hex"), masterKey());
}

export function unwrapDEK(wrappedDEK: EncryptedPayload): string {
  const dek = decrypt(wrappedDEK, masterKey());

  keyFromHex(dek);

  return dek;
}
