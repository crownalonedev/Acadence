import { useId, useState } from 'react';
import { Calculator, GraduationCap } from 'lucide-react';

// Weighted groups for the sample course; "Final exam" is still ungraded.
const groups = [
  { name: 'Problem sets', weight: 30, score: 91 },
  { name: 'Quizzes', weight: 20, score: 86.5 },
  { name: 'Midterm', weight: 25, score: 87 },
  { name: 'Final exam', weight: 25, score: null as number | null },
];

function letter(p: number) {
  if (p >= 93) return 'A';
  if (p >= 90) return 'A-';
  if (p >= 87) return 'B+';
  if (p >= 83) return 'B';
  if (p >= 80) return 'B-';
  if (p >= 77) return 'C+';
  if (p >= 73) return 'C';
  return 'C-';
}

function weighted(finalScore: number | null) {
  let earned = 0;
  let total = 0;
  for (const g of groups) {
    const s = g.name === 'Final exam' ? finalScore : g.score;
    if (s == null) continue;
    earned += s * g.weight;
    total += g.weight;
  }
  return Math.round((earned / total) * 10) / 10;
}

/** Grade card + a working What-If projection, modeled on the app's Grades screen. */
export function GradeCard() {
  const [open, setOpen] = useState(true);
  const [final, setFinal] = useState(92);
  const id = useId();
  const current = weighted(null);
  const projected = weighted(final);
  const delta = Math.round((projected - current) * 10) / 10;

  return (
    <div className="grade-card">
      <div className="grade-head">
        <span className="icon-tile" aria-hidden="true">
          <GraduationCap size={19} />
        </span>
        <div>
          <div className="course-code">MATH 241</div>
          <div style={{ fontWeight: 900, fontSize: 14.5 }}>Multivariable Calculus</div>
        </div>
        <div className="grade-score">
          <b>{current}%</b>
          <span className="letter-pill">{letter(current)}</span>
        </div>
      </div>
      <div className="weights">
        {groups.map((g) => (
          <div className="weight-chip" key={g.name}>
            <small>{g.name}</small>
            <b>{g.weight}%</b>
          </div>
        ))}
      </div>
      <div className="whatif">
        <button type="button" className="whatif-btn" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((v) => !v)}>
          <Calculator size={13} aria-hidden="true" /> What-If
        </button>
        <span className="whatif-note">Simulation only · nothing is sent to Canvas</span>
      </div>
      <div id={`${id}-panel`} hidden={!open}>
        <div className="slider-row">
          <label htmlFor={`${id}-final`}>Final exam</label>
          <input
            id={`${id}-final`}
            type="range"
            min={50}
            max={100}
            value={final}
            onChange={(e) => setFinal(Number(e.target.value))}
          />
          <output htmlFor={`${id}-final`}>{final}%</output>
        </div>
        <div className="projection" aria-live="polite">
          <div>
            <small>CURRENT</small>
            <b>{current}%</b>
          </div>
          <span aria-hidden="true" style={{ color: 'var(--muted)' }}>
            →
          </span>
          <div>
            <small>WHAT-IF</small>
            <b>
              {projected}% <span style={{ fontSize: 12 }}>{letter(projected)}</span>
            </b>
          </div>
          <span className="delta" style={{ color: delta < 0 ? 'var(--danger)' : undefined }}>
            {delta >= 0 ? '+' : ''}
            {delta}
          </span>
        </div>
      </div>
    </div>
  );
}
