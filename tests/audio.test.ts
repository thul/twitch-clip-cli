import { test, expect } from "bun:test";
import { extractAudio } from "../src/audio";

test("invokes ffmpeg with input and output paths", async () => {
  let captured: { cmd: string; args: string[] } | null = null;
  const run = async (cmd: string, args: string[]) => {
    captured = { cmd, args };
    return { code: 0, stdout: "", stderr: "" };
  };

  await extractAudio("clips/ninja-abc.mp4", "clips/ninja-abc.mp3", run);

  expect(captured!.cmd).toBe("ffmpeg");
  expect(captured!.args).toContain("clips/ninja-abc.mp4");
  expect(captured!.args).toContain("clips/ninja-abc.mp3");
  expect(captured!.args).toContain("-vn");
});

test("throws when ffmpeg exits non-zero", async () => {
  const run = async () => ({ code: 1, stdout: "", stderr: "bad" });
  await expect(
    extractAudio("i.mp4", "o.mp3", run),
  ).rejects.toThrow(/ffmpeg failed/i);
});
