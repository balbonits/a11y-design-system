import { THEME_REGISTRY, type Theme } from '../src';
import { useEffect, useRef, useState } from 'react';
import tokens from '../src/tokens.json';

const label = (id: Theme) => THEME_REGISTRY.find((t) => t.id === id)?.label ?? id;

const PAIRS: Array<[string, string, 'text' | 'ui']> = [
  ['--text', '--color-bg', 'text'],
  ['--text', '--surface', 'text'],
  ['--text-muted', '--color-bg', 'text'],
  ['--text-muted', '--surface', 'text'],
  ['--text-muted', '--surface-muted', 'text'],
  ['--accent', '--surface', 'text'],
  ['--accent-contrast', '--accent', 'text'],
  ['--accent-contrast', '--accent-hover', 'text'],
  ['--danger-contrast', '--danger', 'text'],
  ['--danger', '--surface', 'text'],
  ['--success', '--surface', 'text'],
  ['--warning', '--surface', 'text'],
  ['--info', '--surface', 'text'],
  ['--text', '--accent-soft', 'text'],
  ['--highlight-contrast', '--highlight', 'text'],
  ['--border', '--surface', 'ui'],
  ['--focus-ring-color', '--color-bg', 'ui'],
  ['--focus-ring-color', '--surface', 'ui'],
  ['--focus-ring-color', '--border', 'ui'],
];

function rgb(color: string): [number, number, number] {
  const m = color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
  return [m[0], m[1], m[2]];
}
function lum([r, g, b]: [number, number, number]) {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function ratio(a: string, b: string) {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Reads the live token values and computes every documented pair's contrast ratio. */
export function ContrastTable({ theme, mode }: { theme: Theme; mode: 'light' | 'dark' }) {
  const name = `${label(theme)} ${mode}`;
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Array<{ fg: string; bg: string; kind: string; r: number; fgc: string; bgc: string }>>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const probe = document.createElement('span');
    el.appendChild(probe);
    const read = (v: string) => {
      probe.style.color = `var(${v})`;
      return getComputedStyle(probe).color;
    };
    setRows(PAIRS.map(([fg, bg, kind]) => {
      const fgc = read(fg);
      const bgc = read(bg);
      return { fg, bg, kind, r: ratio(fgc, bgc), fgc, bgc };
    }));
    probe.remove();
  }, [theme, mode]);
  return (
    <div ref={ref} data-theme={theme} data-mode={mode} className="em-scope ember sb-unstyled" style={{ background: 'var(--color-bg)', color: 'var(--text)', padding: 16, marginBottom: 16, maxWidth: '100%' }}>
      {/* The table can be wider than a narrow docs column, so it scrolls in its own focusable region. */}
      <div role="region" tabIndex={0} aria-label={`${name} contrast table`} className="sb-scroll">
      <table className="em-table">
        <caption>{name} contrast</caption>
        <thead>
          <tr><th scope="col">Sample</th><th scope="col">Foreground</th><th scope="col">Background</th><th scope="col">Ratio</th><th scope="col">Needs</th><th scope="col">Result</th></tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const need = x.kind === 'ui' ? 3 : 4.5;
            return (
              <tr key={x.fg + x.bg}>
                <td>{x.kind === 'ui'
                  // UI pairs need 3:1, not text contrast, so their sample is a bordered box with no text.
                  ? <span aria-hidden="true" style={{ display: 'inline-block', width: 36, height: 22, verticalAlign: 'middle', background: x.bgc, border: `2px solid ${x.fgc}` }} />
                  : <span style={{ display: 'inline-block', padding: '2px 8px', color: x.fgc, background: x.bgc, border: '1px solid var(--border-subtle)' }}>Aa</span>}</td>
                <td><code>{x.fg}</code></td>
                <td><code>{x.bg}</code></td>
                <td>{x.r.toFixed(2)}:1</td>
                <td>{need}:1 {x.kind === 'ui' ? '(UI)' : '(text)'}</td>
                <td>{x.r >= need ? 'Pass' : 'Fail'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function Swatches({ names }: { names: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
      {THEME_REGISTRY.map((x) => x.id).flatMap((th) => (['light', 'dark'] as const).map((t) => (
        <div key={th + t} data-theme={th} data-mode={t} className="em-scope ember sb-unstyled" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'inherit', gap: 8, background: 'var(--color-bg)', padding: 12 }}>
          <strong style={{ gridColumn: '1 / -1', color: 'var(--text)' }}>{label(th)} {t}</strong>
          {names.map((n) => (
            <div key={n} style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text)' }}>
              <div style={{ height: 40, background: `var(${n})` }} />
              <code style={{ display: 'block', padding: 6, fontSize: 12 }}>{n}</code>
            </div>
          ))}
        </div>
      )))}
    </div>
  );
}

/** One live contrast table per registered theme and mode. */
export function ContrastTables() {
  return <>{THEME_REGISTRY.flatMap((t) => (['light', 'dark'] as const).map((m) => <ContrastTable key={t.id + m} theme={t.id} mode={m} />))}</>;
}

type ThemeJson = { shape: Record<string, string> };
/** The shape, type and motion tokens of every registered theme, read from src/tokens.json. */
export function ShapeTable({ names }: { names: string[] }) {
  const themes = tokens.themes as Record<string, ThemeJson>;
  return (
    <div role="region" tabIndex={0} aria-label="Theme token values" className="sb-scroll">
      <table className="em-table">
        <thead><tr><th scope="col">Token</th>{THEME_REGISTRY.map((t) => <th key={t.id} scope="col">{t.label}</th>)}</tr></thead>
        <tbody>
          {names.map((n) => (
            <tr key={n}><td><code>{n}</code></td>{THEME_REGISTRY.map((t) => <td key={t.id}><code>{themes[t.id]?.shape[n]}</code></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
