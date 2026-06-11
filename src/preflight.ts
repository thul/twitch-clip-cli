export type WhichFn = (bin: string) => Promise<boolean>;

// Bun.which resolves a binary on PATH without spawning a shell, so the binary
// name is never interpolated into a shell command.
const defaultWhich: WhichFn = async (bin) => Bun.which(bin) !== null;

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
