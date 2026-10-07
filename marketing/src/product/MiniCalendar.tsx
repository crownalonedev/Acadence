import { ChevronLeft, ChevronRight } from 'lucide-react';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// Static five-week sample month: day 1 falls on a Wednesday, "today" is the 16th.
const events: Record<number, string[]> = {
  3: ['#2F6B4F'],
  8: ['#9A6A1B', '#A65F3D'],
  14: ['#1F5A44'],
  16: ['#2F6B4F'],
  17: ['#9A6A1B'],
  19: ['#A65F3D'],
  21: ['#1F5A44', '#2F6B4F'],
  27: ['#9A6A1B'],
  30: ['#A65F3D', '#2F6B4F', '#1F5A44'],
};

export function MiniCalendar() {
  const cells: { n: number; out?: boolean }[] = [];
  for (let i = 0; i < 3; i++) cells.push({ n: 28 + i, out: true });
  for (let d = 1; d <= 31; d++) cells.push({ n: d });
  while (cells.length < 35) cells.push({ n: cells.length - 33, out: true });
  return (
    <div className="mini-cal" role="img" aria-label="Month calendar with assignment due dates marked by course color.">
      <div className="mini-cal-head" aria-hidden="true">
        <ChevronLeft size={15} color="var(--muted)" />
        <span>This month</span>
        <ChevronRight size={15} color="var(--muted)" />
      </div>
      <div className="mini-cal-grid" aria-hidden="true">
        {DOW.map((d, i) => (
          <span key={`d${i}`} className="dow">
            {d}
          </span>
        ))}
        {cells.map((c, i) => (
          <span key={i} className={c.out ? 'out' : c.n === 16 ? 'today' : undefined}>
            <span className="num">{c.n}</span>
            {!c.out && events[c.n] ? (
              <span className="cal-dots">
                {events[c.n].map((color, j) => (
                  <i key={j} style={{ background: color }} />
                ))}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
