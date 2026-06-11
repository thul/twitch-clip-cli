import { test, expect } from "bun:test";
import { parseArgs } from "../src/args";

test("parses streamer with defaults", () => {
  const a = parseArgs(["ninja"]);
  expect(a.streamer).toBe("ninja");
  expect(a.mp3).toBe(false);
  expect(a.out).toBe("./clips");
});

test("parses --mp3 and --out", () => {
  const a = parseArgs(["ninja", "--mp3", "--out", "/tmp/x"]);
  expect(a.mp3).toBe(true);
  expect(a.out).toBe("/tmp/x");
});

test("throws when streamer missing", () => {
  expect(() => parseArgs(["--mp3"])).toThrow(/streamer/i);
});

test("no arguments defaults to help", () => {
  const a = parseArgs([]);
  expect(a.help).toBe(true);
});

test("--help and -h set the help flag without requiring a streamer", () => {
  expect(parseArgs(["--help"]).help).toBe(true);
  expect(parseArgs(["-h"]).help).toBe(true);
});
