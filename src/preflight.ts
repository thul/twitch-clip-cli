import { runCommand } from "./run";

export type WhichFn = (bin: string) => Promise<boolean>;

const defaultWhich: WhichFn = async (bin) => {
  const res = await runCommand("sh", ["-c", `command -v ${bin}`]);
  return res.code === 0;
};

export async function checkBinaries(
  bins: string[],
  which: WhichFn = defaultWhich,
): Promise<string[]> {
  const missing: string[] = [];
  for (const bin of bins) {
    if (!(await which(bin))) missing.push(bin);
  }
  return missing;
}
