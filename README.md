# Pretty QR Lab

Pretty QR Lab is a local-first QR generator that works two ways:

- Web UI for interactive tweaking and export.
- CLI for scripts, agents, terminals, and offline generation.

It renders QR codes as SVG first, then converts to PNG when needed. The web app and CLI share the same renderer, so a style selected in the UI can be reproduced from the terminal.

Live page: <https://velizarseleznev.github.io/pretty-qr-lab/>

## Quick Start

```sh
npm install
npm run dev
```

Open the printed local Vite URL, usually `http://127.0.0.1:5173`.

## CLI

Run without installing globally:

```sh
npm run qr -- "https://github.com" --theme aurora --output github.png
```

Or link the local binary:

```sh
npm link
pqr "https://github.com" -o github.png --theme aurora
```

Examples:

```sh
pqr "https://example.com" -o qr.png
pqr "hello from cli" -o hello.svg --frame ticket --eyes orbit
pqr "wifi:T:WPA;S:Guest;P:secret;;" -o wifi.png --safe
pqr "https://github.com" -o branded.png --logo GH --theme ink --frame clover --quiet-zone 10 --seed 7
```

Useful flags:

```text
--theme rose|aurora|ink|citrus|lavender
--frame square|squircle|clover|ticket
--eyes standard|custom|orbit
--shapes squares|dots|mixed
--size 1024
--quiet-zone 5
--seed 1
--logo AI
--safe
--no-connected
--no-ghosts
--no-super-blocks
--list-themes
```

Use `--safe` when scan reliability matters more than decorative styling. Fancy QR codes should always be tested with the target phone camera before printing.

## Themes And Toggles

- `aurora`: mint, blue, violet, and amber modules.
- `rose`: warm rose and plum.
- `ink`: high-contrast document-safe style.
- `citrus`: amber and green.
- `lavender`: violet and blue.

Optional effects:

- Connected pill modules.
- Mixed dots, stars, hexagons, and rounded modules.
- Ghost dots in light areas and frame margins.
- Larger decorative super blocks.
- Standard, custom, or orbit finder eyes.
- Clover, squircle, square, and ticket frames.
- Short center logo text.

## Agent Skill

The project includes a Codex skill description at [`skills/pretty-qr-lab/SKILL.md`](skills/pretty-qr-lab/SKILL.md). It documents when to use `pqr` and which flags keep output scan-safe.

## Development

```sh
npm run build
npm run example
```

`npm run example` writes `examples/example.png`.
