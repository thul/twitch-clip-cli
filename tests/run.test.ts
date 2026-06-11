import { test, expect } from "bun:test";
import { runCommand } from "../src/run";

test("runCommand returns exit code 0 and stdout for success", async () => {
  const res = await runCommand("echo", ["hello"]);
  expect(res.code).toBe(0);
  expect(res.stdout.trim()).toBe("hello");
});

test("runCommand returns non-zero code for failing command", async () => {
  const res = await runCommand("sh", ["-c", "exit 3"]);
  expect(res.code).toBe(3);
});
