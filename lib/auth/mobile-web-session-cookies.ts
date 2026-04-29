import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getAuthSecret } from "@/lib/auth/secrets";

const sealedCookieHeaderPrefix = "v1";
const cookieNamePattern = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function encryptionKey(): Buffer {
  return createHash("sha256").update(getAuthSecret()).digest();
}

function isBetterAuthCookieName(name: string): boolean {
  const unprefixed = name.startsWith("__Secure-")
    ? name.slice("__Secure-".length)
    : name.startsWith("__Host-")
      ? name.slice("__Host-".length)
      : name;

  return unprefixed.startsWith("better-auth.");
}

function hasInvalidCookieValueCharacters(value: string): boolean {
  return /[\r\n;]/.test(value);
}

export function extractPortableBetterAuthCookieHeader(cookieHeader: string): string | null {
  const cookies = new Map<string, string>();

  cookieHeader.split(";").forEach((segment) => {
    const trimmed = segment.trim();
    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      return;
    }

    const name = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);

    if (
      cookieNamePattern.test(name) &&
      isBetterAuthCookieName(name) &&
      value.length > 0 &&
      !hasInvalidCookieValueCharacters(value)
    ) {
      cookies.set(name, value);
    }
  });

  if (cookies.size === 0) {
    return null;
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export function sealMobileWebSessionCookieHeader(cookieHeader: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(cookieHeader, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    sealedCookieHeaderPrefix,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function unsealMobileWebSessionCookieHeader(value: string): string | null {
  if (!value.startsWith(`${sealedCookieHeaderPrefix}.`)) {
    return extractPortableBetterAuthCookieHeader(value);
  }

  const [, ivBase64, authTagBase64, ciphertextBase64] = value.split(".");

  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    return null;
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivBase64, "base64url"));

    decipher.setAuthTag(Buffer.from(authTagBase64, "base64url"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextBase64, "base64url")),
      decipher.final(),
    ]).toString("utf8");

    return extractPortableBetterAuthCookieHeader(plaintext);
  } catch {
    return null;
  }
}
