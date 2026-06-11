import { test, expect } from "bun:test";
import { tmpdir } from "os";
import { join } from "path";
import { rm } from "fs/promises";
import { saveTokens } from "../src/tokenStore";
import { getAuthProvider } from "../src/auth";

const cfg = {
  clientId: "cid",
  clientSecret: "secret",
  redirectUri: "http://localhost:3000/callback",
};

test("uses cached token and does not trigger login", async () => {
  const path = join(tmpdir(), "clip-maker-auth-test.tokens.json");
  await saveTokens(path, {
    accessToken: "a",
    refreshToken: "r",
    expiresIn: 3600,
    obtainmentTimestamp: 1000,
    scope: ["clips:edit"],
    userId: "999",
  } as any);

  let loginCalled = false;
  const login = async () => {
    loginCalled = true;
    throw new Error("login should not run");
  };

  const { userId } = await getAuthProvider(cfg, path, login);
  expect(userId).toBe("999");
  expect(loginCalled).toBe(false);
  await rm(path, { force: true });
});

test("runs login when no cached token exists", async () => {
  const path = join(tmpdir(), "clip-maker-auth-missing.tokens.json");
  await rm(path, { force: true });

  let loginCalled = false;
  const login = async () => {
    loginCalled = true;
    return {
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 3600,
      obtainmentTimestamp: 1000,
      scope: ["clips:edit"],
      userId: "777",
    };
  };

  const { userId } = await getAuthProvider(cfg, path, login as any);
  expect(loginCalled).toBe(true);
  expect(userId).toBe("777");
  await rm(path, { force: true });
});
