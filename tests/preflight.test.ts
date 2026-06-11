import { test, expect } from "bun:test";
import { checkBinaries } from "../src/preflight";

test("returns empty array when all binaries present", async () => {
  const which = async (_bin: string) => true;
  const missing = await checkBinaries(["yt-dlp", "ffmpeg"], which);
  expect(missing).toEqual([]);
});

test("returns names of missing binaries", async () => {
  const which = async (bin: string) => bin === "ffmpeg";
  const missing = await checkBinaries(["yt-dlp", "ffmpeg"], which);
  expect(missing).toEqual(["yt-dlp"]);
});
