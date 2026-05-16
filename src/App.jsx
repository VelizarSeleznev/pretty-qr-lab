import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultOptions, palettes } from './palettes.js';
import { renderQrSvg, svgToDataUri } from './renderQr.js';
import './styles.css';

function App() {
  const [options, setOptions] = useState(defaultOptions);
  const palette = palettes[options.theme];
  const svg = useMemo(() => renderQrSvg(options), [options]);
  const dataUri = useMemo(() => svgToDataUri(svg), [svg]);

  function update(patch) {
    setOptions((current) => ({ ...current, ...patch }));
  }

  async function downloadPng() {
    const image = new Image();
    image.decoding = 'async';
    image.src = dataUri;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = options.size;
    canvas.height = options.size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const link = document.createElement('a');
    link.download = 'pretty-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function downloadSvg() {
    const link = document.createElement('a');
    link.download = 'pretty-qr.svg';
    link.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    link.click();
  }

  const cli = `pqr ${JSON.stringify(options.text || ' ')} --theme ${options.theme} --frame ${options.frame} --eyes ${options.eyes} --shapes ${options.shapes} --seed ${options.seed} -o qr.png`;

  return (
    <main className="app" style={{ '--bg': palette.background, '--panel': palette.panel, '--surface': palette.surface, '--text': palette.text, '--muted': palette.muted, '--accent': palette.eye }}>
      <section className="previewPane">
        <header className="topbar">
          <div className="brandMark">QR</div>
          <div>
            <h1>Pretty QR Lab</h1>
            <p>Local web UI and CLI QR generator.</p>
          </div>
        </header>

        <div className="qrStage">
          <img src={dataUri} alt="Generated QR code preview" className="qrPreview" />
        </div>

        <div className="previewActions">
          <button type="button" onClick={() => update({ seed: options.seed + 1 })}>Randomize</button>
          <button type="button" onClick={downloadPng}>PNG</button>
          <button type="button" onClick={downloadSvg}>SVG</button>
        </div>

        <div className="cliStrip">
          <span>CLI</span>
          <code>{cli}</code>
        </div>
      </section>

      <section className="controlPane" aria-label="QR controls">
        <label className="fieldLabel" htmlFor="qr-text">Content</label>
        <textarea
          id="qr-text"
          value={options.text}
          onChange={(event) => update({ text: event.target.value })}
          placeholder="Paste a URL, text, Wi-Fi payload, vCard, or anything else"
        />

        <div className="sectionTitle">Themes</div>
        <div className="swatches">
          {Object.entries(palettes).map(([key, item]) => (
            <button
              type="button"
              className={options.theme === key ? 'swatch active' : 'swatch'}
              style={{ '--swatch': item.surface, '--swatchAccent': item.eye }}
              onClick={() => update({ theme: key })}
              title={item.name}
              aria-label={item.name}
              key={key}
            />
          ))}
        </div>

        <Segmented
          label="Frame"
          value={options.frame}
          choices={['clover', 'squircle', 'square', 'ticket']}
          onChange={(frame) => update({ frame, quietZone: frame === 'clover' ? 10 : 4 })}
        />
        <Segmented label="Eyes" value={options.eyes} choices={['custom', 'orbit', 'standard']} onChange={(eyes) => update({ eyes })} />
        <Segmented label="Modules" value={options.shapes} choices={['mixed', 'dots', 'squares']} onChange={(shapes) => update({ shapes })} />

        <div className="toggleGrid">
          <Toggle label="Safe mode" checked={options.safeMode} onChange={(safeMode) => update({ safeMode })} />
          <Toggle label="Pill links" checked={options.connected} onChange={(connected) => update({ connected })} disabled={options.safeMode} />
          <Toggle label="Ghost dots" checked={options.ghosts} onChange={(ghosts) => update({ ghosts })} disabled={options.safeMode} />
          <Toggle label="Super blocks" checked={options.superBlocks} onChange={(superBlocks) => update({ superBlocks })} disabled={options.safeMode} />
        </div>

        <Range label="Quiet zone" value={options.quietZone} min={2} max={12} step={1} onChange={(quietZone) => update({ quietZone })} />
        <Range label="Clover ears" value={options.cloverDepth} min={0.04} max={0.16} step={0.01} onChange={(cloverDepth) => update({ cloverDepth })} />
        <Range label="Clover body" value={options.cloverBaseSize} min={0.38} max={0.56} step={0.01} onChange={(cloverBaseSize) => update({ cloverBaseSize })} />

        <div className="inlineFields">
          <label>
            <span>Logo text</span>
            <input value={options.logoText} maxLength={6} onChange={(event) => update({ logoText: event.target.value })} placeholder="AI" />
          </label>
          <label>
            <span>Seed</span>
            <input type="number" value={options.seed} min={1} onChange={(event) => update({ seed: Number(event.target.value) || 1 })} />
          </label>
        </div>
      </section>
    </main>
  );
}

function Segmented({ label, value, choices, onChange }) {
  return (
    <div className="controlBlock">
      <div className="sectionTitle">{label}</div>
      <div className="segmented">
        {choices.map((choice) => (
          <button type="button" className={value === choice ? 'selected' : ''} onClick={() => onChange(choice)} key={choice}>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label className={disabled ? 'toggle disabled' : 'toggle'}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function Range({ label, value, min, max, step, onChange }) {
  return (
    <label className="range">
      <span>{label}<b>{Number(value).toFixed(step < 1 ? 2 : 0)}</b></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

createRoot(document.getElementById('root')).render(<App />);
