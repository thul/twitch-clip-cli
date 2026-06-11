import { runCommand, type RunResult } from "./run";

export type RunFn = (cmd: string, args: string[]) => Promise<RunResult>;

export async function downloadClip(
  clipUrl: string,
  outPath: string,
  run: RunFn = runCommand,
): Promise<void> {
  // "--" stops option parsing so a URL beginning with "-" can never be read as
  // a yt-dlp flag (argument injection).
  const res = await run("yt-dlp", ["-o", outPath, "--", clipUrl]);
  if (res.code !== 0) {
    throw new Error(`yt-dlp failed (exit ${res.code}): ${res.stderr}`);
  }
}
