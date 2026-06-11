import { test, expect } from "bun:test";
import { resolveBroadcaster, createClip, waitForClip } from "../src/twitch";

function mockApi(overrides: any = {}) {
  const api: any = {
    users: {
      getUserByName: async (login: string) =>
        login === "ninja" ? { id: "123", name: "ninja" } : null,
    },
    clips: {
      createClip: async (_opts: any) => "clip-abc",
      getClipById: async (_id: string) => ({ id: "clip-abc", url: "https://clips.twitch.tv/clip-abc" }),
    },
    ...overrides,
  };
  // asUser runs the callback with the same client acting as the given user.
  api.asUser = async (_userId: string, cb: (ctx: any) => any) => cb(api);
  return api;
}

test("resolveBroadcaster returns the user when found", async () => {
  const user = await resolveBroadcaster(mockApi(), "ninja");
  expect(user.id).toBe("123");
});

test("resolveBroadcaster throws when streamer not found", async () => {
  await expect(resolveBroadcaster(mockApi(), "nobody")).rejects.toThrow(/not found/i);
});

test("createClip returns the clip id", async () => {
  const id = await createClip(mockApi(), "999", "123");
  expect(id).toBe("clip-abc");
});

test("createClip runs in the authenticated user's context", async () => {
  const seen: string[] = [];
  const api = mockApi();
  api.asUser = async (userId: string, cb: (ctx: any) => any) => {
    seen.push(userId);
    return cb(api);
  };
  await createClip(api, "999", "123");
  expect(seen).toEqual(["999"]);
});

test("waitForClip returns the clip once it resolves", async () => {
  let calls = 0;
  const api = mockApi({
    clips: {
      getClipById: async (_id: string) => {
        calls++;
        return calls >= 2 ? { id: "clip-abc", url: "u" } : null;
      },
    },
  });
  const sleep = async () => {};
  const clip = await waitForClip(api, "clip-abc", { intervalMs: 1, maxMs: 100, sleep });
  expect(clip.url).toBe("u");
  expect(calls).toBe(2);
});

test("waitForClip throws on timeout", async () => {
  const api = mockApi({ clips: { getClipById: async () => null } });
  const sleep = async () => {};
  await expect(
    waitForClip(api, "clip-abc", { intervalMs: 1, maxMs: 3, sleep }),
  ).rejects.toThrow(/not ready/i);
});
