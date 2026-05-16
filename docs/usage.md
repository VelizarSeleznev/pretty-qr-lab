# Usage Notes

## Web UI

Start the app:

```sh
npm run dev
```

The UI is the fastest way to discover a look. The command strip under the preview mirrors the active settings as a `pqr` command.

## CLI

The CLI accepts the payload as its first positional argument and writes PNG or SVG based on the output extension.

```sh
pqr "https://example.com" --theme aurora --frame clover -o qr.png
```

Custom colors:

```sh
pqr "https://example.com" \
  --surface '#ffffff' \
  --eye-color '#111827' \
  --module-colors '#111827,#0f766e,#d78722,#9739a8' \
  -o custom.svg
```

Finder-eye controls:

```sh
pqr "https://example.com" --eyes custom --eye-center star --same-eyes -o star-eyes.png
pqr "https://example.com" --eyes custom --eye-center mixed --rotate-eyes --eye-speed 10 -o rotating-eyes.svg
```

For automation, prefer:

```sh
pqr "$PAYLOAD" --safe -o out.png
```

The `--safe` profile disables decorative noise and unusual module shapes. It keeps the high error correction level but also makes the visible pattern more conventional.

## Reliability

Decorative QR codes are still QR codes, but scanners vary. Before printing or sharing widely:

1. Test the generated file on the target phone camera.
2. Use `--safe` for Wi-Fi credentials, payment links, event check-ins, or anything operationally important.
3. Keep `--quiet-zone` at `4` or higher for printed material.
4. Avoid long payloads with heavy decoration.
