import type { ReactNode } from 'react';
import { Shell } from '../components/Shell';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Shell>
      <article className="container prose-page">
        <span className="overline">Acadence</span>
        <h1>{title}</h1>
        <p className="updated">Last updated {updated}</p>
        {children}
      </article>
    </Shell>
  );
}
