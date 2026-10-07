import type { ReactNode } from 'react';
import { Nav } from './Nav';
import { Footer } from './Footer';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
