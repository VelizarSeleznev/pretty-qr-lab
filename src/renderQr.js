import qrcode from 'qrcode-generator';
import { defaultOptions, palettes } from './palettes.js';

const ns = 'http://www.w3.org/2000/svg';

export function normalizeOptions(input = {}) {
  const options = { ...defaultOptions, ...input };
  options.size = clamp(Number(options.size) || defaultOptions.size, 256, 4096);
  options.quietZone = clamp(Number(options.quietZone) || defaultOptions.quietZone, 2, 12);
  options.cloverDepth = clamp(Number(options.cloverDepth) || defaultOptions.cloverDepth, 0.02, 0.14);
  options.cloverBaseSize = clamp(Number(options.cloverBaseSize) || defaultOptions.cloverBaseSize, 0.38, 0.56);
  options.seed = Math.max(1, Math.floor(Number(options.seed) || 1));
  if (!palettes[options.theme]) options.theme = defaultOptions.theme;
  if (options.safeMode) {
    options.ghosts = false;
    options.shapes = 'squares';
    options.connected = false;
    options.superBlocks = false;
    options.eyes = 'standard';
    options.frame = options.frame === 'clover' ? 'squircle' : options.frame;
  }
  return options;
}

export function renderQrSvg(input = {}) {
  const options = normalizeOptions(input);
  const palette = palettes[options.theme];
  const qr = qrcode(0, 'H');
  qr.addData(options.text || ' ');
  qr.make();

  const count = qr.getModuleCount();
  const margin = options.quietZone;
  const totalCount = count + margin * 2;
  const cell = options.size / totalCount;
  const random = seededRandom(options.seed + String(options.text || '').length * 97);
  const parts = [];
  const visited = Array.from({ length: count }, () => Array(count).fill(false));

  parts.push(`<svg xmlns="${ns}" width="${options.size}" height="${options.size}" viewBox="0 0 ${options.size} ${options.size}" role="img" aria-label="QR code">`);
  parts.push(frameSvg(options, palette));

  drawEyes(parts, options, palette, count, margin, cell);

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (isEyeArea(row, col, count)) continue;
      const x = (col + margin) * cell;
      const y = (row + margin) * cell;
      const dark = qr.isDark(row, col);

      if (dark && !visited[row][col]) {
        const color = pick(palette.modules, random);
        const blockSize = findSuperBlock(qr, visited, row, col, count, options.superBlocks);
        if (blockSize) {
          markVisited(visited, row, col, blockSize, blockSize);
          parts.push(superBlockSvg(x, y, blockSize * cell, color, random));
          continue;
        }

        const run = options.connected ? findRun(qr, visited, row, col, count, random) : null;
        if (run && run.length > 1) {
          if (run.horizontal) {
            markVisited(visited, row, col, 1, run.length);
            parts.push(pillSvg(x, y, run.length * cell, cell, color));
          } else {
            markVisited(visited, row, col, run.length, 1);
            parts.push(pillSvg(x, y, cell, run.length * cell, color));
          }
          continue;
        }

        visited[row][col] = true;
        parts.push(moduleSvg(x, y, cell, color, options.shapes, random));
      } else if (!dark && options.ghosts && random() < 0.28) {
        parts.push(moduleSvg(x + cell * 0.18, y + cell * 0.18, cell * 0.64, pick(palette.ghosts, random), options.shapes, random, palette.ghostOpacity));
      }
    }
  }

  if (options.ghosts) drawMarginGhosts(parts, options, palette, count, margin, cell, random);
  if (options.logoText) drawLogo(parts, options, palette);

  parts.push('</svg>');
  return parts.join('');
}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function frameSvg(options, palette) {
  const size = options.size;
  if (options.frame === 'square') {
    return `<rect width="${size}" height="${size}" fill="${palette.surface}"/>`;
  }
  if (options.frame === 'squircle') {
    return `<rect x="${size * 0.03}" y="${size * 0.03}" width="${size * 0.94}" height="${size * 0.94}" rx="${size * 0.19}" fill="${palette.surface}"/>`;
  }
  if (options.frame === 'ticket') {
    const cut = size * 0.075;
    return `<path d="M ${cut} 0 H ${size - cut} Q ${size} 0 ${size} ${cut} V ${size - cut} Q ${size} ${size} ${size - cut} ${size} H ${cut} Q 0 ${size} 0 ${size - cut} V ${cut} Q 0 0 ${cut} 0 Z M 0 ${size / 2} a ${cut} ${cut} 0 1 0 0 1 Z M ${size} ${size / 2} a ${cut} ${cut} 0 1 1 0 1 Z" fill="${palette.surface}" fill-rule="evenodd"/>`;
  }
  return cloverFrameSvg(options, palette);
}

function cloverFrameSvg(options, palette) {
  const size = options.size;
  const cx = size / 2;
  const cy = size / 2;
  const base = size * options.cloverBaseSize;
  const amp = size * options.cloverDepth;
  const points = [];

  for (let degree = 0; degree < 360; degree += 2) {
    const angle = (degree * Math.PI) / 180;
    const radius = base + amp * Math.cos(4 * (angle - Math.PI / 4));
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }

  const path = smoothClosedPath(points, 0.18);
  const highlight = smoothClosedPath(points.map(([x, y]) => [cx + (x - cx) * 0.955, cy + (y - cy) * 0.955]), 0.18);
  return [
    `<defs>`,
    `<filter id="cloverShadow" x="-20%" y="-20%" width="140%" height="140%">`,
    `<feDropShadow dx="0" dy="${round(size * 0.018)}" stdDeviation="${round(size * 0.022)}" flood-color="#000000" flood-opacity="0.18"/>`,
    `</filter>`,
    `</defs>`,
    `<path d="${path}" fill="${palette.surface}" stroke="${palette.surface}" stroke-width="${round(size * 0.01)}" stroke-linejoin="round" filter="url(#cloverShadow)"/>`,
    `<path d="${highlight}" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="${round(size * 0.012)}"/>`,
  ].join('');
}

function drawEyes(parts, options, palette, count, margin, cell) {
  const positions = [
    [0, 0, 'poly'],
    [0, count - 7, 'star'],
    [count - 7, 0, 'orbit'],
  ];
  for (const [row, col, kind] of positions) {
    const x = (col + margin) * cell;
    const y = (row + margin) * cell;
    const cx = x + 3.5 * cell;
    const cy = y + 3.5 * cell;
    if (options.eyes === 'standard') {
      parts.push(`<rect x="${x}" y="${y}" width="${7 * cell}" height="${7 * cell}" fill="${palette.eye}"/>`);
      parts.push(`<rect x="${x + cell}" y="${y + cell}" width="${5 * cell}" height="${5 * cell}" fill="${palette.surface}"/>`);
      parts.push(`<rect x="${x + 2 * cell}" y="${y + 2 * cell}" width="${3 * cell}" height="${3 * cell}" fill="${palette.eye}"/>`);
      continue;
    }
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${3.35 * cell}" fill="${palette.eye}"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${2.35 * cell}" fill="${palette.surface}"/>`);
    if (options.eyes === 'orbit' || kind === 'orbit') {
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${1.8 * cell}" ry="${1.1 * cell}" fill="${palette.eye}" transform="rotate(-28 ${cx} ${cy})"/>`);
      parts.push(`<circle cx="${cx + 1.2 * cell}" cy="${cy - 0.8 * cell}" r="${0.42 * cell}" fill="${palette.surface}"/>`);
    } else if (kind === 'star') {
      parts.push(pathTag(starPath(cx, cy, 1.65 * cell, 8, 0.56), palette.eye));
    } else {
      parts.push(pathTag(polygonPath(cx, cy, 1.55 * cell, 6), palette.eye));
    }
  }
}

function drawMarginGhosts(parts, options, palette, count, margin, cell, random) {
  const size = options.size;
  const cx = size / 2;
  const cy = size / 2;
  for (let row = -margin; row < count + margin; row += 1) {
    for (let col = -margin; col < count + margin; col += 1) {
      if (row >= 0 && row < count && col >= 0 && col < count) continue;
      const x = (col + margin) * cell;
      const y = (row + margin) * cell;
      const px = x + cell / 2;
      const py = y + cell / 2;
      if (isInsideFrame(px, py, options, cx, cy, size, cell) && random() < 0.22) {
        parts.push(moduleSvg(x + cell * 0.18, y + cell * 0.18, cell * 0.64, pick(palette.ghosts, random), options.shapes, random, palette.ghostOpacity * 0.75));
      }
    }
  }
}

function drawLogo(parts, options, palette) {
  const size = options.size;
  const w = size * 0.18;
  const x = size / 2 - w / 2;
  const y = size / 2 - w / 2;
  const text = escapeXml(String(options.logoText).slice(0, 6));
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${w * 0.22}" fill="${palette.surface}" stroke="${palette.eye}" stroke-width="${size * 0.012}"/>`);
  parts.push(`<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" fill="${palette.eye}" font-family="Inter, ui-sans-serif, system-ui" font-size="${w * 0.35}" font-weight="800">${text}</text>`);
}

function isInsideFrame(px, py, options, cx, cy, size, cell) {
  if (options.frame === 'clover') {
    const angle = Math.atan2(py - cy, px - cx);
    const distance = Math.hypot(py - cy, px - cx);
    return distance < size * options.cloverBaseSize - size * options.cloverDepth * Math.cos(4 * angle) - cell * 1.5;
  }
  return px > cell && px < size - cell && py > cell && py < size - cell;
}

function findSuperBlock(qr, visited, row, col, count, enabled) {
  if (!enabled || isEyeArea(row, col, count) || !qr.isDark(row, col) || visited[row][col]) return null;
  for (const size of [3, 2]) {
    if (row + size > count || col + size > count) continue;
    let ok = true;
    for (let r = 0; r < size && ok; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!qr.isDark(row + r, col + c) || visited[row + r][col + c] || isEyeArea(row + r, col + c, count)) {
          ok = false;
          break;
        }
      }
    }
    if (ok) return size;
  }
  return null;
}

function findRun(qr, visited, row, col, count, random) {
  let horizontal = random() > 0.5;
  const max = 2 + Math.floor(random() * 3);
  let length = measureRun(qr, visited, row, col, count, max, horizontal);
  if (length === 1) {
    horizontal = false;
    length = measureRun(qr, visited, row, col, count, max, horizontal);
  }
  return { horizontal, length };
}

function measureRun(qr, visited, row, col, count, max, horizontal) {
  let length = 1;
  while (length < max) {
    const r = row + (horizontal ? 0 : length);
    const c = col + (horizontal ? length : 0);
    if (r >= count || c >= count || !qr.isDark(r, c) || visited[r][c] || isEyeArea(r, c, count)) break;
    length += 1;
  }
  return length;
}

function markVisited(visited, row, col, rows, cols) {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) visited[row + r][col + c] = true;
  }
}

function moduleSvg(x, y, size, color, style, random, opacity = 1) {
  const gap = size * (style === 'squares' ? 0.06 : 0.12);
  const box = [x + gap, y + gap, size - gap * 2, size - gap * 2];
  const attrs = `fill="${color}"${opacity < 1 ? ` opacity="${round(opacity)}"` : ''}`;
  if (style === 'squares') return `<rect x="${round(box[0])}" y="${round(box[1])}" width="${round(box[2])}" height="${round(box[3])}" rx="${round(size * 0.1)}" ${attrs}/>`;
  if (style === 'dots') return `<circle cx="${round(x + size / 2)}" cy="${round(y + size / 2)}" r="${round(size / 2 - gap)}" ${attrs}/>`;
  const shape = random();
  if (shape < 0.3) return `<circle cx="${round(x + size / 2)}" cy="${round(y + size / 2)}" r="${round(size / 2 - gap)}" ${attrs}/>`;
  if (shape < 0.52) return pathTag(polygonPath(x + size / 2, y + size / 2, size / 2 - gap, 6), color, opacity);
  if (shape < 0.72) return pathTag(starPath(x + size / 2, y + size / 2, size / 2 - gap, 4, 0.56), color, opacity);
  return `<rect x="${round(box[0])}" y="${round(box[1])}" width="${round(box[2])}" height="${round(box[3])}" rx="${round(size * 0.24)}" ${attrs}/>`;
}

function superBlockSvg(x, y, size, color, random) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = size * 0.45;
  if (random() > 0.48) return pathTag(starPath(cx, cy, radius, 8, 0.72), color);
  return `<rect x="${round(cx - radius)}" y="${round(cy - radius)}" width="${round(radius * 2)}" height="${round(radius * 2)}" rx="${round(radius * 0.42)}" fill="${color}"/>`;
}

function pillSvg(x, y, w, h, color) {
  const gap = Math.min(w, h) * 0.1;
  return `<rect x="${round(x + gap)}" y="${round(y + gap)}" width="${round(w - gap * 2)}" height="${round(h - gap * 2)}" rx="${round(Math.min(w, h) * 0.42)}" fill="${color}"/>`;
}

function polygonPath(cx, cy, radius, sides) {
  const commands = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    commands.push(`${i === 0 ? 'M' : 'L'} ${round(cx + Math.cos(angle) * radius)} ${round(cy + Math.sin(angle) * radius)}`);
  }
  return `${commands.join(' ')} Z`;
}

function starPath(cx, cy, radius, points, innerRatio) {
  const commands = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? radius : radius * innerRatio;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    commands.push(`${i === 0 ? 'M' : 'L'} ${round(cx + Math.cos(angle) * r)} ${round(cy + Math.sin(angle) * r)}`);
  }
  return `${commands.join(' ')} Z`;
}

function smoothClosedPath(points, tension = 0.18) {
  const commands = [];
  const total = points.length;
  for (let i = 0; i < total; i += 1) {
    const previous = points[(i - 1 + total) % total];
    const current = points[i];
    const next = points[(i + 1) % total];
    const afterNext = points[(i + 2) % total];
    const cp1 = [
      current[0] + (next[0] - previous[0]) * tension,
      current[1] + (next[1] - previous[1]) * tension,
    ];
    const cp2 = [
      next[0] - (afterNext[0] - current[0]) * tension,
      next[1] - (afterNext[1] - current[1]) * tension,
    ];
    if (i === 0) commands.push(`M ${round(current[0])} ${round(current[1])}`);
    commands.push(`C ${round(cp1[0])} ${round(cp1[1])} ${round(cp2[0])} ${round(cp2[1])} ${round(next[0])} ${round(next[1])}`);
  }
  return `${commands.join(' ')} Z`;
}

function pathTag(d, color, opacity = 1) {
  return `<path d="${d}" fill="${color}"${opacity < 1 ? ` opacity="${round(opacity)}"` : ''}/>`;
}

function isEyeArea(row, col, count) {
  return (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);
}

function seededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Number(value.toFixed(3));
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  }[char]));
}
