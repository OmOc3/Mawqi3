function getAuthSecretFromEnv(): string {
  const secret = process.env.ROLE_COOKIE_SECRET ?? process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("ROLE_COOKIE_SECRET must be at least 32 characters.");
  }

  return secret;
}

export function getAuthSecret(): string {
  return getAuthSecretFromEnv();
}
