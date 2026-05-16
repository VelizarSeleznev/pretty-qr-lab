#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { Command, InvalidArgumentError } from 'commander';
import { defaultOptions, optionChoices, palettes, resolvePalette } from '../src/palettes.js';
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
  .option('--eye-center <style>', `eye center: ${optionChoices.eyeCenter.join(', ')}`, defaultOptions.eyeCenter)
  .option('--same-eyes', 'use the same center shape for all three finder eyes')
  .option('--rotate-eyes', 'animate finder eyes in SVG output')
  .option('--eye-speed <seconds>', 'finder eye rotation duration', parseInteger, defaultOptions.eyeSpeed)
  .option('-s, --shapes <style>', `modules: ${optionChoices.shapes.join(', ')}`, defaultOptions.shapes)
  .option('--size <px>', 'output size in pixels', parseInteger, defaultOptions.size)
  .option('--quiet-zone <cells>', 'quiet zone in QR cells', parseInteger, defaultOptions.quietZone)
  .option('--seed <number>', 'deterministic style seed', parseInteger, defaultOptions.seed)
  .option('--logo <text>', 'short text badge in the center')
  .option('--clover-depth <number>', 'clover ear depth from 0.02 to 0.14', parseNumber, defaultOptions.cloverDepth)
  .option('--clover-base <number>', 'clover base size from 0.38 to 0.56', parseNumber, defaultOptions.cloverBaseSize)
  .option('--background <hex>', 'custom app/background color, for PNG background')
  .option('--surface <hex>', 'custom frame/background color inside the QR')
  .option('--eye-color <hex>', 'custom finder eye color')
  .option('--module-colors <list>', 'comma-separated module colors, e.g. #111111,#008c78,#d78722')
  .option('--ghost-colors <list>', 'comma-separated ghost module colors')
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
  pqr "hello" --surface '#ffffff' --eye-color '#111827' --module-colors '#111827,#0f766e,#d78722'
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
assertChoice('eye-center', flags.eyeCenter, optionChoices.eyeCenter);
assertChoice('shapes', flags.shapes, optionChoices.shapes);

const customColors = buildCustomColors(flags);

const options = normalizeOptions({
  text,
  theme: flags.theme,
  frame: flags.frame,
  eyes: flags.eyes,
  eyeCenter: flags.eyeCenter,
  eyeDifferent: !flags.sameEyes,
  animatedEyes: flags.rotateEyes,
  eyeSpeed: flags.eyeSpeed,
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
  customColors,
});

const svg = renderQrSvg(options);
const palette = resolvePalette(options);

if (ext === '.svg') {
  writeFileSync(output, svg, 'utf8');
} else if (ext === '.png' || ext === '') {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: options.size },
    background: palette.background,
  }).render().asPng();
  writeFileSync(output, png);
} else {
  throw new Error(`Unsupported output extension "${ext}". Use .png or .svg.`);
}

function buildCustomColors(flags) {
  const custom = {};
  if (flags.background) custom.background = assertColor(flags.background, 'background');
  if (flags.surface) custom.surface = assertColor(flags.surface, 'surface');
  if (flags.eyeColor) custom.eye = assertColor(flags.eyeColor, 'eye-color');
  if (flags.moduleColors) custom.modules = parseColorList(flags.moduleColors, 'module-colors');
  if (flags.ghostColors) custom.ghosts = parseColorList(flags.ghostColors, 'ghost-colors');
  return Object.keys(custom).length ? custom : null;
}

function parseColorList(value, name) {
  const colors = value.split(',').map((item) => assertColor(item.trim(), name));
  if (!colors.length) throw new Error(`Invalid ${name}: expected at least one color`);
  return colors;
}

function assertColor(value, name) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Invalid ${name} "${value}". Use #rrggbb format.`);
  }
  return value;
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
