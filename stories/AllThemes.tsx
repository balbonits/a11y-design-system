import type { ReactNode } from 'react';
import { THEME_REGISTRY, type ThemeEntry } from '../src';

/** Renders the same content in every registered theme, in light and dark, side by side (R-2). Each cell
 *  is an .em-scope with both attributes set, so the token layers resolve per cell. Themes come from the
 *  registry, so a new theme appears here with no story change. */
export function AllThemes({ children, themes = THEME_REGISTRY }: { children: (label: string) => ReactNode; themes?: readonly ThemeEntry[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
      {themes.flatMap((t) => (['light', 'dark'] as const).map((m) => {
        const label = `${t.label} ${m}`;
        return (
          <section key={label} aria-label={label} data-theme={t.id} data-mode={m} className="em-scope ember sb-unstyled"
            style={{ background: 'var(--color-bg)', color: 'var(--text)', padding: 16, borderRadius: 'var(--radius-lg)', minWidth: 0 }}>
            <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-display)' as never, fontSize: 'var(--text-lg)' }}>{label}</p>
            {children(label)}
          </section>
        );
      }))}
    </div>
  );
}
