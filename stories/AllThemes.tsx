import type { ReactNode } from 'react';
import { THEMES, type Theme } from '../src';

const NAME: Record<Theme, string> = { editorial: 'Editorial', bold: 'Bold', tactile: 'Tactile' };

/** Renders the same content in all 6 theme x mode combos side by side (R-2). Each cell is an
 *  .em-scope with both attributes set, so the token layers resolve per cell. */
export function AllThemes({ children }: { children: (label: string) => ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
      {THEMES.flatMap((t) => (['light', 'dark'] as const).map((m) => {
        const label = `${NAME[t]} ${m}`;
        return (
          <section key={label} aria-label={label} data-theme={t} data-mode={m} className="em-scope ember sb-unstyled"
            style={{ background: 'var(--color-bg)', color: 'var(--text)', padding: 16, borderRadius: 'var(--radius-field)', minWidth: 0 }}>
            <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-display)' as never, fontSize: 'var(--text-lg)' }}>{label}</p>
            {children(label)}
          </section>
        );
      }))}
    </div>
  );
}
