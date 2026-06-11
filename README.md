# clip-maker

CLI that clips ~the last 30 seconds of a live Twitch streamer, downloads the
mp4, and optionally extracts the audio to mp3.

## Requirements

- [Bun](https://bun.sh)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) on your PATH
- [ffmpeg](https://ffmpeg.org/download.html) on your PATH (only needed for `--mp3`)

## Setup

1. Register an app at https://dev.twitch.tv/console/apps with redirect URI
   `http://localhost:3000/callback`.
2. Copy `.env.example` to `.env` and fill in `TWITCH_CLIENT_ID` and
   `TWITCH_CLIENT_SECRET`.
3. `bun install`

## Usage

```
bun run src/cli.ts <streamer> [--mp3] [--out ./clips]
```

First run opens a browser to authorize (token cached at
`~/.config/clip-maker/tokens.json` and auto-refreshed thereafter).

## Build a standalone binary

```
bun run build
./clip-maker <streamer> --mp3
```

The binary bundles the Bun runtime but NOT yt-dlp/ffmpeg, which must still be
installed on the target machine.

## Notes

- Twitch decides clip length (~25-30s); duration is not caller-settable.
- The channel must be live at the moment you run the command.
