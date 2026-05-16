---
name: pretty-qr-lab
description: Generate local QR codes through the Pretty QR Lab CLI and know when to use safe or decorative output. Use when a user asks Codex to make a QR code, create a styled QR image, generate QR locally, or reproduce a QR style from the Pretty QR Lab web UI.
---

# Pretty QR Lab

Use the local project at `/Users/velizard/Projects/pretty-qr-lab` to generate QR codes. The CLI binary is `pqr` when linked, or `npm run qr --` from the project directory.

## Common Commands

From the project directory:

```sh
npm run qr -- "https://example.com" -o qr.png
npm run qr -- "hello" -o hello.svg --theme ink --safe
npm run qr -- "https://github.com" -o github.png --theme aurora --frame clover --eyes orbit --seed 7
```

If linked with `npm link`:

```sh
pqr "https://example.com" -o qr.png
```

## Style Flags

- `--theme rose|aurora|ink|citrus|lavender`
- `--frame square|squircle|clover|ticket`
- `--eyes standard|custom|orbit`
- `--shapes squares|dots|mixed`
- `--logo <short text>`
- `--seed <number>`
- `--no-connected`
- `--no-ghosts`
- `--no-super-blocks`

## Safety Defaults

Use `--safe` for Wi-Fi, payment, ticketing, check-in, emergency, or print-critical QR codes. Decorative mode is fine for casual links, profile pages, demos, and social sharing, but still test the output with a phone camera before handing it off.

## Web UI

Start the local UI:

```sh
npm run dev
```

The web app shows the equivalent CLI command under the QR preview. Use it to discover settings, then run the CLI command for repeatable output.
