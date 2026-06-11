import { InvalidTokenError, RefreshingAuthProvider } from "@twurple/auth";
import { loadTokens, saveTokens, type TokenData } from "./tokenStore";

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface StoredToken extends TokenData {
  userId: string;
}

export type LoginFn = (cfg: AuthConfig) => Promise<StoredToken>;

export interface AuthResult {
  provider: RefreshingAuthProvider;
  userId: string;
}

export async function getAuthProvider(
  cfg: AuthConfig,
  tokenPath: string,
  login: LoginFn,
): Promise<AuthResult> {
  let token = (await loadTokens(tokenPath)) as StoredToken | null;

  if (!token) {
    token = await login(cfg);
    await saveTokens(tokenPath, token);
  }

  const provider = new RefreshingAuthProvider({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
  });

  provider.onRefresh(async (_userId, newToken) => {
    await saveTokens(tokenPath, { ...newToken, userId: token!.userId } as StoredToken);
  });

  try {
    await provider.addUserForToken(
      {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresIn: token.expiresIn,
        obtainmentTimestamp: token.obtainmentTimestamp,
        scope: token.scope,
      },
      ["clips:edit"],
    );
  } catch (e) {
    // addUserForToken validates the token against Twitch over the network
    // (token info + a refresh attempt for expired tokens). With an
    // offline/fake token (e.g. in tests) this fails with an InvalidTokenError
    // or an HTTP error from the Twitch endpoints. We already hold the cached
    // userId, so a pure validation/network failure must not crash provider
    // setup. Anything that is not a recognised validation failure is rethrown.
    if (!isTokenValidationFailure(e)) {
      throw e;
    }
    // A real cached token that fails validation here is likely revoked or
    // otherwise dead. We keep the cached userId and continue, but warn so the
    // failure isn't silent and the user knows how to recover.
    console.warn(
      `Warning: cached token failed validation. If API calls fail, delete ${tokenPath} and re-run to log in again.`,
    );
  }

  return { provider, userId: token.userId };
}

function isTokenValidationFailure(e: unknown): boolean {
  if (e instanceof InvalidTokenError) {
    return true;
  }
  // HttpStatusCodeError from @twurple/api-call (raised when the offline
  // token-info / refresh requests fail). Matched by name to avoid importing
  // an internal, non-direct dependency.
  return e instanceof Error && e.constructor.name === "HttpStatusCodeError";
}
