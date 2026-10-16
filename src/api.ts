/**
 * The TheSignCo API and sign-in, from the phone.
 *
 * Same API as the web portal (signage.wingtheidea.com/api), same sign-in:
 * email, then a six-digit code, through Cognito's public API over HTTPS.
 * Tokens are kept on the phone so staff stay signed in for 30 days.
 *
 * Requests go through CloudFront, which signs them for the API with Origin
 * Access Control — so the ID token travels in x-id-token, and POST bodies
 * carry their SHA-256.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";

export const API_BASE = "https://signage.wingtheidea.com/api";
const TOKENS_KEY = "thesignco.field.tokens";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface Config {
  readonly region: string;
  readonly clientId: string;
}

interface Tokens {
  readonly idToken: string;
  readonly refreshToken?: string;
}

let config: Promise<Config> | null = null;
const loadConfig = () => (config ??= request<Config>("/config", { anonymous: true }).catch((e) => ((config = null), Promise.reject(e))));

async function readTokens(): Promise<Tokens | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

const writeTokens = (tokens: Tokens | null) => (tokens ? AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens)) : AsyncStorage.removeItem(TOKENS_KEY));

function expiry(idToken: string): number {
  try {
    const part = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(globalThis.atob(part)) as { exp: number }).exp * 1000;
  } catch {
    return 0;
  }
}

async function cognito<T>(target: string, body: unknown): Promise<T> {
  const { region } = await loadConfig();
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: { "content-type": "application/x-amz-json-1.1", "x-amz-target": `AWSCognitoIdentityProviderService.${target}` },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { __type?: string; message?: string };
  if (!response.ok) {
    const name = (payload.__type ?? "").split("#").pop() ?? "";
    throw Object.assign(new Error(payload.message ?? name), { name });
  }
  return payload;
}

/** A valid ID token, refreshed when close to expiry; null when signed out. */
export async function idToken(): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;
  if (expiry(tokens.idToken) - 60_000 > Date.now()) return tokens.idToken;
  if (!tokens.refreshToken) return null;
  try {
    const { clientId } = await loadConfig();
    const result = await cognito<{ AuthenticationResult?: { IdToken: string } }>("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId,
      AuthParameters: { REFRESH_TOKEN: tokens.refreshToken },
    });
    if (!result.AuthenticationResult) return null;
    await writeTokens({ idToken: result.AuthenticationResult.IdToken, refreshToken: tokens.refreshToken });
    return result.AuthenticationResult.IdToken;
  } catch (error) {
    // Offline: keep the tokens and try again later. Refused: sign out.
    if ((error as { name?: string }).name === "NotAuthorizedException") await writeTokens(null);
    return null;
  }
}

export const hasSession = async () => (await readTokens()) !== null;
export const signOut = () => writeTokens(null);

export async function request<T>(path: string, init: { body?: unknown; anonymous?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (!init.anonymous) {
    const token = await idToken();
    if (!token) throw new ApiError("Your session has ended. Sign in again.", 401);
    headers["x-id-token"] = token;
  }
  let body: string | undefined;
  if (init.body !== undefined) {
    body = JSON.stringify(init.body);
    headers["content-type"] = "application/json";
    headers["x-amz-content-sha256"] = await digestStringAsync(CryptoDigestAlgorithm.SHA256, body);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method: body === undefined ? "GET" : "POST", headers, body });
  } catch {
    throw new ApiError("No connection.", 0);
  }
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new ApiError(payload.error ?? `Request failed (${response.status})`, response.status);
  return payload;
}

// --- sign-in --------------------------------------------------------------------

export interface PendingSignIn {
  readonly email: string;
  readonly session: string;
  readonly username: string;
  readonly demo: boolean;
}

export class SignInError extends Error {
  constructor(
    message: string,
    readonly retryWith?: PendingSignIn,
  ) {
    super(message);
  }
}

function friendly(error: unknown): SignInError {
  if (error instanceof SignInError) return error;
  if (error instanceof ApiError) return new SignInError(error.status === 0 ? "No connection. Sign in needs signal." : error.message);
  switch ((error as { name?: string }).name) {
    case "NotAuthorizedException":
      return new SignInError("That code has expired or been tried too many times. Send a new code.");
    case "UserNotFoundException":
      return new SignInError("No account uses that email address.");
    case "LimitExceededException":
    case "TooManyRequestsException":
      return new SignInError("Too many attempts. Wait a moment and try again.");
    default:
      return new SignInError("Could not sign in. Try again.");
  }
}

export async function requestCode(email: string): Promise<PendingSignIn> {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new SignInError("Enter a valid email address.");
  try {
    const prepared = await request<{ role: string }>("/auth/prepare", { body: { email: address }, anonymous: true });
    if (prepared.role !== "recce" && prepared.role !== "installer") {
      throw new SignInError("This app is for TheSignCo's field staff. Use signage.wingtheidea.com in a browser.");
    }
    const { clientId } = await loadConfig();
    const result = await cognito<{ ChallengeName?: string; Session?: string; ChallengeParameters?: Record<string, string> }>("InitiateAuth", {
      AuthFlow: "CUSTOM_AUTH",
      ClientId: clientId,
      AuthParameters: { USERNAME: address },
    });
    if (result.ChallengeName !== "CUSTOM_CHALLENGE" || !result.Session) throw new SignInError("Email codes are not available for this account.");
    return { email: address, session: result.Session, username: result.ChallengeParameters?.USERNAME ?? address, demo: result.ChallengeParameters?.demo === "true" };
  } catch (error) {
    throw friendly(error);
  }
}

export async function submitCode(pending: PendingSignIn, code: string): Promise<void> {
  try {
    const { clientId } = await loadConfig();
    const result = await cognito<{ AuthenticationResult?: { IdToken: string; RefreshToken?: string }; Session?: string }>("RespondToAuthChallenge", {
      ClientId: clientId,
      ChallengeName: "CUSTOM_CHALLENGE",
      Session: pending.session,
      ChallengeResponses: { USERNAME: pending.username, ANSWER: code },
    });
    if (!result.AuthenticationResult) {
      throw new SignInError("That code is not right. Check the email and try again.", result.Session ? { ...pending, session: result.Session } : undefined);
    }
    await writeTokens({ idToken: result.AuthenticationResult.IdToken, refreshToken: result.AuthenticationResult.RefreshToken });
  } catch (error) {
    throw friendly(error);
  }
}

/** Uploads a captured file straight to S3; returns its key for the submission. */
export async function uploadFile(outletId: string, kind: "recce" | "video" | "before" | "after" | "ticket", uri: string, contentType: string): Promise<string> {
  const { key, url } = await request<{ key: string; url: string }>("/uploads", { body: { outletId, kind, contentType } });
  let blob: Blob;
  try {
    blob = await (await fetch(uri)).blob();
  } catch {
    throw new ApiError("A photo on this phone could not be read. Retake it.", 400);
  }
  let put: Response;
  try {
    put = await fetch(url, { method: "PUT", headers: { "content-type": contentType }, body: blob });
  } catch {
    throw new ApiError("No connection.", 0);
  }
  if (!put.ok) throw new ApiError(`Upload failed (${put.status})`, put.status);
  return key;
}
