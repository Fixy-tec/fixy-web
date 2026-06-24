import { OAuth2Client } from "google-auth-library";

export function getFrontendUrl(): string {
  return (
    process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export function getGoogleRedirectUri(): string {
  return `${getFrontendUrl()}/api/auth/google/callback`;
}

export function getGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados",
    );
  }

  return new OAuth2Client(clientId, clientSecret, getGoogleRedirectUri());
}
