export interface ParsedArgs {
  streamer: string;
  mp3: boolean;
  out: string;
  help: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  // No arguments at all defaults to showing help.
  if (argv.length === 0) {
    return { streamer: "", mp3: false, out: "./clips", help: true };
  }

  let streamer: string | undefined;
  let mp3 = false;
  let out = "./clips";
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--mp3") {
      mp3 = true;
    } else if (arg === "--out") {
      const val = argv[++i];
      if (val === undefined || val.startsWith("--")) {
        throw new Error("--out requires a directory argument");
      }
      out = val;
    } else if (!arg.startsWith("--") && streamer === undefined) {
      streamer = arg;
    }
  }

  if (help) return { streamer: streamer ?? "", mp3, out, help: true };
  if (!streamer) throw new Error("Missing required argument: streamer");
  return { streamer, mp3, out, help: false };
}
