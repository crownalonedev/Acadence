import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';
const KEY = 'acadence.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function current(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return media().matches ? 'dark' : 'light';
}

/** Light/dark toggle that follows the system until the visitor picks one, like the app's 'system' default. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    const m = media();
    const onChange = () => {
      if (!document.documentElement.dataset.theme) setTheme(current());
    };
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  const apply = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // storage unavailable (private mode); the choice just won't persist
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
      apply(next);
      return;
    }
    // Same left-to-right wipe the app uses in ThemeToggleButton.web.tsx
    const transition = doc.startViewTransition(() => flushSync(() => apply(next)));
    await transition.ready;
    document.documentElement.animate(
      { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] },
      { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
    );
  }, [theme, apply]);

  return { theme, toggle };
}
