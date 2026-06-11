import { test, expect } from "bun:test";
import { downloadClip } from "../src/download";

test("invokes yt-dlp with url and output path", async () => {
  let captured: { cmd: string; args: string[] } | null = null;
  const run = async (cmd: string, args: string[]) => {
    captured = { cmd, args };
    return { code: 0, stdout: "", stderr: "" };
  };

  await downloadClip("https://clips.twitch.tv/abc", "clips/ninja-abc.mp4", run);

  expect(captured!.cmd).toBe("yt-dlp");
  expect(captured!.args).toContain("https://clips.twitch.tv/abc");
  expect(captured!.args).toContain("clips/ninja-abc.mp4");
});

test("throws when yt-dlp exits non-zero", async () => {
  const run = async () => ({ code: 1, stdout: "", stderr: "boom" });
  await expect(
    downloadClip("u", "o.mp4", run),
  ).rejects.toThrow(/yt-dlp failed/i);
});
