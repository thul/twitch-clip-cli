import { runCommand, type RunResult } from "./run";

export type RunFn = (cmd: string, args: string[]) => Promise<RunResult>;

export async function extractAudio(
  mp4Path: string,
  mp3Path: string,
  run: RunFn = runCommand,
): Promise<void> {
  const res = await run("ffmpeg", ["-y", "-i", mp4Path, "-vn", "-q:a", "0", mp3Path]);
  if (res.code !== 0) {
    throw new Error(`ffmpeg failed (exit ${res.code}): ${res.stderr}`);
  }
}
