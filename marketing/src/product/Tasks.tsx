import { useState } from 'react';
import { Check } from 'lucide-react';

const STRIKE =
  'M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36';

const initial = [
  { id: 't1', label: 'Problem set 7', meta: 'MATH 241 · Due tomorrow', done: false },
  { id: 't2', label: 'Lab report 4: Enzyme kinetics', meta: 'BIO 201 · Due today', done: true },
  { id: 't3', label: 'Reading response: Chapter 12', meta: 'HIST 150 · Due in 5 days', done: false },
];

/** Task list with the app's hand-drawn strike-through (PlayfulTaskToggle.web). */
export function Tasks() {
  const [tasks, setTasks] = useState(initial);
  return (
    <ul>
      {tasks.map((t) => (
        <li key={t.id} className={`task${t.done ? ' done' : ''}`}>
          <button
            type="button"
            role="checkbox"
            aria-checked={t.done}
            aria-label={t.label}
            className="task-check"
            onClick={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
          >
            {t.done ? <Check size={16} strokeWidth={3.5} aria-hidden="true" /> : null}
          </button>
          <div className="task-label">
            <span className="task-title">
              {t.label}
              <svg viewBox="0 0 340 32" preserveAspectRatio="none" aria-hidden="true">
                <path d={STRIKE} vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinecap="round" fill="none" />
              </svg>
            </span>
            <small>{t.meta}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
