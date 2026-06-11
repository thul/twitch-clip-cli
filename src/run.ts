export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export async function runCommand(cmd: string, args: string[]): Promise<RunResult> {
  const proc = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, stdout, stderr };
}
