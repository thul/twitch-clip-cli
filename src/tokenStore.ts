import { chmod, mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  obtainmentTimestamp: number;
  scope: string[];
}

export async function loadTokens(path: string): Promise<TokenData | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as TokenData;
  } catch {
    return null;
  }
}

export async function saveTokens(path: string, data: TokenData): Promise<void> {
  // Tokens are sensitive credentials: keep the dir and file owner-only (0700/0600).
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  // mode on writeFile only applies when the file is newly created; chmod ensures
  // an existing file (e.g. overwritten on token refresh) is also locked down.
  await chmod(path, 0o600);
}
