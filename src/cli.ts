#!/usr/bin/env bun
import { homedir } from "os";
import { join } from "path";
import { ApiClient } from "@twurple/api";
import { parseArgs } from "./args";
import { checkBinaries } from "./preflight";
import { getAuthProvider } from "./auth";
import { login } from "./login";
import { resolveBroadcaster, createClip, waitForClip } from "./twitch";
import { downloadClip } from "./download";
import { extractAudio } from "./audio";

const TOKEN_PATH = join(homedir(), ".config", "clip-maker", "tokens.json");

const HELP = `clip-maker — clip ~the last 30s of a live Twitch stream

Usage:
  clip-maker <streamer> [--mp3] [--out <dir>]

Arguments:
  <streamer>        Twitch login name of a currently-live channel

Options:
  --mp3             Also extract the clip audio to an mp3
  --out <dir>       Output directory (default: ./clips)
  -h, --help        Show this help

Setup:
  Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (see .env.example).
  Requires yt-dlp and ffmpeg on your PATH.
  First run opens a browser to authorize; the token is cached and refreshed.`;

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }

  const missing = await checkBinaries(["yt-dlp", "ffmpeg"]);
  if (missing.length) {
    console.error(`Missing required tools: ${missing.join(", ")}`);
    console.error("Install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation");
    console.error("Install ffmpeg: https://ffmpeg.org/download.html");
    process.exit(1);
  }

  const cfg = {
    clientId: process.env.TWITCH_CLIENT_ID ?? "",
    clientSecret: process.env.TWITCH_CLIENT_SECRET ?? "",
    redirectUri: process.env.TWITCH_REDIRECT_URI ?? "http://localhost:3000/callback",
  };
  if (!cfg.clientId || !cfg.clientSecret) {
    console.error("Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (see .env.example).");
    process.exit(1);
  }

  const { provider, userId } = await getAuthProvider(cfg, TOKEN_PATH, login);
  const api = new ApiClient({ authProvider: provider });

  const broadcaster = await resolveBroadcaster(api, args.streamer);
  console.log(`Clipping ${broadcaster.name}...`);

  const clipId = await createClip(api, userId, broadcaster.id);
  console.log(`Clip created (${clipId}), waiting for it to be ready...`);

  const clip = await waitForClip(api, clipId);

  const mp4Path = join(args.out, `${broadcaster.name}-${clipId}.mp4`);
  await downloadClip(clip.url, mp4Path);
  console.log(`Downloaded: ${mp4Path}`);

  if (args.mp3) {
    const mp3Path = join(args.out, `${broadcaster.name}-${clipId}.mp3`);
    await extractAudio(mp4Path, mp3Path);
    console.log(`Audio: ${mp3Path}`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
