import { useState } from 'react';
import { notifications } from './data';

/**
 * The stacked notification tray from NotificationPopover.web: cards sit stacked and fan out on
 * hover. `interactive` swaps hover for an explicit toggle button so it works by keyboard and touch.
 */
export function NotificationStack({ interactive = false, count = 3 }: { interactive?: boolean; count?: number }) {
  const [hovered, setHovered] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const expanded = interactive ? pinnedOpen : hovered;
  const items = notifications.slice(0, count);
  return (
    <div
      className="notif-tray"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="notif-tray-head">
        <span>Notifications</span>
        <span>{items.length} unread</span>
      </div>
      <ul className={`notif-stack collapsible${expanded ? ' expanded' : ''}`}>
        {items.map((n) => (
          <li key={n.id} className="notif">
            <div className="notif-top">
              <span className="notif-dot" aria-hidden="true" />
              <span className="notif-kind">{n.kind}</span>
              <span className="notif-time">{n.time}</span>
            </div>
            <div className="notif-title">{n.title}</div>
            <div className="notif-body">{n.body}</div>
          </li>
        ))}
      </ul>
      {interactive ? (
        <button type="button" className="notif-toggle" aria-expanded={expanded} onClick={() => setPinnedOpen((v) => !v)}>
          {expanded ? 'Stack notifications' : `Show all ${items.length}`}
        </button>
      ) : null}
    </div>
  );
}
