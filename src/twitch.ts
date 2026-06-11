import type { ApiClient } from "@twurple/api";

export interface Broadcaster {
  id: string;
  name: string;
}

export interface Clip {
  id: string;
  url: string;
}

export async function resolveBroadcaster(api: ApiClient, login: string): Promise<Broadcaster> {
  const user = await api.users.getUserByName(login);
  if (!user) throw new Error(`Streamer "${login}" not found`);
  return { id: user.id, name: user.name };
}

export async function createClip(
  api: ApiClient,
  userId: string,
  broadcasterId: string,
): Promise<string> {
  // Clip creation must run in the authenticated user's context. On the base
  // ApiClient the context user would default to the broadcaster, whose token
  // we don't hold, so we explicitly scope the call to our logged-in user.
  return await api.asUser(userId, (ctx) => ctx.clips.createClip({ channel: broadcasterId }));
}

export interface WaitOptions {
  intervalMs?: number;
  maxMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function waitForClip(
  api: ApiClient,
  clipId: string,
  opts: WaitOptions = {},
): Promise<Clip> {
  const intervalMs = opts.intervalMs ?? 2000;
  const maxMs = opts.maxMs ?? 30000;
  const sleep = opts.sleep ?? defaultSleep;

  let waited = 0;
  while (waited <= maxMs) {
    const clip = await api.clips.getClipById(clipId);
    if (clip) return { id: clip.id, url: clip.url };
    await sleep(intervalMs);
    waited += intervalMs;
  }
  throw new Error(`Clip ${clipId} not ready after ${maxMs}ms`);
}
