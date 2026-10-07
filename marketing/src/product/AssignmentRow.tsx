import { CalendarClock, Pin } from 'lucide-react';
import type { Assignment } from './data';

/** Mirrors the "Needs attention" row on the app's Home screen. */
export function AssignmentRow({ a, pinned = a.pinned }: { a: Assignment; pinned?: boolean }) {
  return (
    <div className={`a-row${pinned ? ' pinned' : ''}`}>
      <div className="a-row-body">
        <div className="a-title">{a.name}</div>
        <div className="a-course">{a.course}</div>
        <div className={`due-chip${a.soon ? ' soon' : ''}`}>
          <CalendarClock size={13} aria-hidden="true" />
          <span>
            <b>{a.label}</b>
            <small>{a.exact}</small>
          </span>
        </div>
      </div>
      <span className="a-points">{a.points} pts</span>
      <span className={`pin-btn${pinned ? ' on' : ''}`} aria-hidden="true">
        <Pin size={15} fill={pinned ? 'currentColor' : 'none'} />
      </span>
    </div>
  );
}
