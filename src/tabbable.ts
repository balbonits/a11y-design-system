const CANDIDATES = 'a[href],area[href],button,input,select,textarea,summary,iframe,audio[controls],video[controls],[contenteditable]:not([contenteditable="false"]),[tabindex]';

/**
 * The elements inside `root` that Tab can reach, in DOM order: tabindex 0 or more, enabled, not `type="hidden"`,
 * not inside `[hidden]` or `[inert]`, rendered, and only one radio per named group (the checked one, else the first).
 */
export function tabbable(root: ParentNode): HTMLElement[] {
  const radios = new Set<string>();
  return [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter((el) => {
    if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[hidden],[inert]')) return false;
    if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true })) return false;
    if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
      const group = [...(el.form ?? el.ownerDocument).querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`)];
      const stop = group.find((r) => r.checked) ?? group[0];
      if (el !== stop || radios.has(el.name)) return false;
      radios.add(el.name);
    }
    return true;
  });
}
