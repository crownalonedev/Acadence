import { useId, useState } from 'react';
import { ChevronDown, Megaphone } from 'lucide-react';
import { announcements } from './data';

/** Expandable announcement cards, like the app's Announcements screen. */
export function Announcements() {
  const [open, setOpen] = useState<string | null>(announcements[0].id);
  const base = useId();
  return (
    <div>
      {announcements.map((a) => {
        const expanded = open === a.id;
        const panel = `${base}-${a.id}`;
        return (
          <div key={a.id} className={`ann${expanded ? ' open' : ''}`}>
            <button type="button" aria-expanded={expanded} aria-controls={panel} onClick={() => setOpen(expanded ? null : a.id)}>
              <span className="icon-tile" aria-hidden="true">
                <Megaphone size={15} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="ann-title">{a.title}</span>
                <span className="ann-meta">{a.meta}</span>
              </span>
              <ChevronDown size={17} className="chev" aria-hidden="true" />
            </button>
            <div className="ann-panel" id={panel} role="region" aria-label={a.title} inert={!expanded}>
              <div>
                <p>{a.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
