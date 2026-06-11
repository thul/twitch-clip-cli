import { exchangeCode } from "@twurple/auth";
import type { AuthConfig, StoredToken } from "./auth";

const SCOPES = ["clips:edit"];

export async function login(cfg: AuthConfig): Promise<StoredToken> {
  // CSRF protection: an unguessable state tied to this login attempt. Twitch
  // echoes it back on the callback; we reject any callback whose state does not
  // match, so a forged request cannot inject an attacker's authorization code.
  const state = crypto.randomUUID();

  const authUrl =
    `https://id.twitch.tv/oauth2/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(cfg.clientId)}` +
    `&redirect_uri=${encodeURIComponent(cfg.redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
    `&state=${encodeURIComponent(state)}`;

  const port = new URL(cfg.redirectUri).port || "3000";

  const code: string = await new Promise((resolve, reject) => {
    const server = Bun.serve({
      port: Number(port),
      fetch(req) {
        const url = new URL(req.url);
        const c = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        if (c && returnedState === state) {
          resolve(c);
          server.stop();
          return new Response("Authorized. You can close this tab.");
        }
        reject(new Error(c ? "State mismatch in callback" : "No code in callback"));
        server.stop();
        return new Response("Authorization failed.", { status: 400 });
      },
    });
    console.log(`Open this URL to authorize:\n${authUrl}`);
    // Open the browser without going through a shell to avoid quoting issues.
    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    try {
      Bun.spawn([opener, authUrl]);
    } catch {
      // No browser opener available; the user can open the printed URL manually.
    }
  });

  const tokens = await exchangeCode(cfg.clientId, cfg.clientSecret, code, cfg.redirectUri);

  const res = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Client-Id": cfg.clientId,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch authenticated user info (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { data?: { id: string }[] };
  const userId = body.data?.[0]?.id;
  if (!userId) {
    throw new Error("Could not determine authenticated user id from Twitch response");
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    obtainmentTimestamp: tokens.obtainmentTimestamp,
    scope: tokens.scope,
    userId,
  };
}
