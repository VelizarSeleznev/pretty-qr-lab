#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { Command, InvalidArgumentError } from 'commander';
import { defaultOptions, optionChoices, palettes } from '../src/palettes.js';
import { normalizeOptions, renderQrSvg } from '../src/renderQr.js';

const program = new Command();

program
  .name('pqr')
  .description('Generate readable or fancy QR codes as SVG or PNG.')
  .argument('[text]', 'text or URL to encode')
  .option('-o, --output <path>', 'output file path', 'qr.png')
  .option('-t, --theme <name>', `theme: ${optionChoices.theme.join(', ')}`, defaultOptions.theme)
  .option('-f, --frame <shape>', `frame: ${optionChoices.frame.join(', ')}`, defaultOptions.frame)
  .option('-e, --eyes <style>', `eyes: ${optionChoices.eyes.join(', ')}`, defaultOptions.eyes)
  .option('-s, --shapes <style>', `modules: ${optionChoices.shapes.join(', ')}`, defaultOptions.shapes)
  .option('--size <px>', 'output size in pixels', parseInteger, defaultOptions.size)
  .option('--quiet-zone <cells>', 'quiet zone in QR cells', parseInteger, defaultOptions.quietZone)
  .option('--seed <number>', 'deterministic style seed', parseInteger, defaultOptions.seed)
  .option('--logo <text>', 'short text badge in the center')
  .option('--clover-depth <number>', 'clover ear depth from 0.02 to 0.14', parseNumber, defaultOptions.cloverDepth)
  .option('--clover-base <number>', 'clover base size from 0.38 to 0.56', parseNumber, defaultOptions.cloverBaseSize)
  .option('--no-connected', 'disable connected pill modules')
  .option('--no-ghosts', 'disable decorative ghost modules')
  .option('--no-super-blocks', 'disable large decorative modules')
  .option('--safe', 'maximize scan reliability by turning decorative effects down')
  .option('--list-themes', 'print available themes')
  .addHelpText('after', `
Examples:
  pqr "https://github.com" -o github.png --theme aurora
  pqr "wifi:T:WPA;S:Guest;P:secret;;" -o wifi.svg --safe
  pqr "hello" --frame ticket --eyes orbit --logo hi --seed 8
`)
  .parse();

const flags = program.opts();

if (flags.listThemes) {
  for (const [key, palette] of Object.entries(palettes)) {
    console.log(`${key.padEnd(9)} ${palette.name}`);
  }
  process.exit(0);
}

const text = program.args[0] ?? defaultOptions.text;
const output = resolve(flags.output);
const ext = extname(output).toLowerCase();
assertChoice('theme', flags.theme, optionChoices.theme);
assertChoice('frame', flags.frame, optionChoices.frame);
assertChoice('eyes', flags.eyes, optionChoices.eyes);
assertChoice('shapes', flags.shapes, optionChoices.shapes);

const options = normalizeOptions({
  text,
  theme: flags.theme,
  frame: flags.frame,
  eyes: flags.eyes,
  shapes: flags.shapes,
  size: flags.size,
  quietZone: flags.quietZone,
  seed: flags.seed,
  logoText: flags.logo ?? '',
  cloverDepth: flags.cloverDepth,
  cloverBaseSize: flags.cloverBase,
  connected: flags.connected,
  ghosts: flags.ghosts,
  superBlocks: flags.superBlocks,
  safeMode: flags.safe,
});

const svg = renderQrSvg(options);

if (ext === '.svg') {
  writeFileSync(output, svg, 'utf8');
} else if (ext === '.png' || ext === '') {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: options.size },
    background: palettes[options.theme].background,
  }).render().asPng();
  writeFileSync(output, png);
} else {
  throw new Error(`Unsupported output extension "${ext}". Use .png or .svg.`);
}

console.log(`Wrote ${output}`);

function assertChoice(name, value, choices) {
  if (!choices.includes(value)) {
    throw new Error(`Invalid ${name} "${value}". Use one of: ${choices.join(', ')}`);
  }
}

function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new InvalidArgumentError('expected an integer');
  return parsed;
}

function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) throw new InvalidArgumentError('expected a number');
  return parsed;
}
