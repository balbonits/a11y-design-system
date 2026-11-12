import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type TabItem = { id: string; label: string; content: ReactNode; disabled?: boolean };
export type TabsProps = { label: string; tabs: TabItem[]; defaultTab?: string; onChange?: (id: string) => void };

/** WAI-ARIA tabs with automatic activation: arrows, Home and End move and select. */
export function Tabs({ label, tabs, defaultTab, onChange }: TabsProps) {
  const base = useId();
  const enabled = tabs.filter((t) => !t.disabled);
  const [chosen, setActive] = useState(defaultTab);
  // The selected tab is always an enabled one, so exactly one tab is in the Tab order (WCAG 2.1.1). A defaultTab that
  // is disabled or unknown, or a selected tab that becomes disabled, falls back to the first enabled tab.
  const active = enabled.some((t) => t.id === chosen) ? chosen : enabled[0]?.id;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: string) {
    setActive(id);
    onChange?.(id);
    refs.current[id]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    const i = enabled.findIndex((t) => t.id === active);
    let next: TabItem | undefined;
    if (e.key === 'ArrowRight') next = enabled[(i + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(i - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (!next) return;
    e.preventDefault();
    select(next.id);
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="em-tablist" onKeyDown={onKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            disabled={t.disabled}
            className="em-tab"
            onClick={() => select(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="em-tabpanel em-focus"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
