import { test, expect } from "bun:test";
import { tmpdir } from "os";
import { join } from "path";
import { rm, stat } from "fs/promises";
import { loadTokens, saveTokens } from "../src/tokenStore";

const tmpPath = join(tmpdir(), "clip-maker-test.tokens.json");

test("loadTokens returns null when file does not exist", async () => {
  await rm(tmpPath, { force: true });
  const data = await loadTokens(tmpPath);
  expect(data).toBeNull();
});

test("saveTokens then loadTokens round-trips data", async () => {
  const tokens = {
    accessToken: "a",
    refreshToken: "r",
    expiresIn: 3600,
    obtainmentTimestamp: 1000,
    scope: ["clips:edit"],
  };
  await saveTokens(tmpPath, tokens);
  const loaded = await loadTokens(tmpPath);
  expect(loaded).toEqual(tokens);
  await rm(tmpPath, { force: true });
});

test("saveTokens writes the credential file owner-only (0600)", async () => {
  await saveTokens(tmpPath, {
    accessToken: "a",
    refreshToken: "r",
    expiresIn: 3600,
    obtainmentTimestamp: 1000,
    scope: ["clips:edit"],
  });
  const mode = (await stat(tmpPath)).mode & 0o777;
  expect(mode).toBe(0o600);
  await rm(tmpPath, { force: true });
});
