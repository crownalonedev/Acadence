import { useEffect, useRef, useState } from 'react';
import { CircleCheck, Globe, LoaderCircle, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../components/Brand';

const steps = [
  {
    title: 'Add the Acadence Connector',
    text: 'A small browser extension that reads from the Canvas account you’re already signed in to.',
  },
  {
    title: 'Open Canvas and sign in as usual',
    text: 'Go to your school’s Canvas dashboard. There’s no new login and no access token to paste.',
  },
  {
    title: 'Connect & sync',
    text: 'Courses, assignments, grades, announcements and assignment groups come into Acadence. Later syncs keep it up to date.',
  },
];

const collected = ['Courses', 'Assignments', 'Grades', 'Announcements', 'Assignment groups'];

/** Recreation of extension/popup.html with a short simulated sync. */
function ConnectorDemo() {
  const [phase, setPhase] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [count, setCount] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const run = () => {
    window.clearInterval(timer.current);
    setPhase('syncing');
    setCount(0);
    let n = 0;
    timer.current = window.setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= collected.length) {
        window.clearInterval(timer.current);
        setPhase('done');
      }
    }, 380);
  };

  return (
    <div className="connector">
      <div className="connector-tab" aria-hidden="true">
        <Globe size={13} /> your-school.instructure.com
      </div>
      <BrandMark />
      <h3>Canvas Connector</h3>
      <p>Open your Canvas dashboard, then connect this site. Acadence only imports academic data you choose to sync.</p>
      <button type="button" className="btn btn-primary" onClick={run} disabled={phase === 'syncing'}>
        {phase === 'done' ? 'Sync again' : 'Connect & sync Canvas'}
      </button>
      <div className="sync-status" aria-live="polite">
        {phase === 'syncing' ? (
          <>
            <LoaderCircle size={14} className="spin" aria-hidden="true" /> Syncing…
          </>
        ) : phase === 'done' ? (
          <>
            <CircleCheck size={14} aria-hidden="true" /> Synced. Open Acadence to see it.
          </>
        ) : null}
      </div>
      <ul className="sync-list" aria-label="Data collected">
        {collected.map((c, i) => (
          <li key={c} className={i < count ? 'done' : undefined}>
            <CircleCheck size={14} aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-title">
      <div className="container how">
        <div>
          <div className="section-head reveal" style={{ marginBottom: 32 }}>
            <span className="overline">How it works</span>
            <h2 id="how-title" className="section-title">
              Connected in three steps.
            </h2>
            <p className="section-lead">
              Acadence pulls from the Canvas session already open in your browser. No new account to link and nothing to paste.
            </p>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} className="step reveal" style={{ '--delay': `${i * 70}ms` } as React.CSSProperties}>
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="privacy-note reveal">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Your Canvas password and access tokens are never stored by Acadence.</span>
          </div>
        </div>
        <div className="connector-stage reveal">
          <ConnectorDemo />
        </div>
      </div>
    </section>
  );
}
