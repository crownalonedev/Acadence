import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { GitHubIcon } from './GitHubIcon';
import { navLinks, site } from '../site';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth > 860 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav${scrolled || open ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <Brand />
        <nav aria-label="Primary" className="nav-links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          {site.githubUrl ? (
            <a className="icon-btn" href={site.githubUrl} aria-label="Acadence on GitHub" style={{ color: 'var(--text)' }}>
              <GitHubIcon />
            </a>
          ) : null}
          <ThemeToggle />
          <a className="btn btn-primary btn-sm nav-cta" href="/#early-access">
            Follow development
          </a>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={`mobile-menu${open ? ' open' : ''}`}>
        <nav aria-label="Mobile" className="container">
          <ul>
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={close}>
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a className="btn btn-primary" href="/#early-access" onClick={close}>
                Follow development
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
