import { ArrowRight } from 'lucide-react';
import { AppPreview } from '../product/AppPreview';
import { NotificationStack } from '../product/NotificationStack';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-copy">
          <div className="status-pill hero-enter">
            <span className="tag">In development</span>
            Built for students on Canvas
          </div>
          <h1 id="hero-title" className="hero-enter" style={{ '--delay': '80ms' } as React.CSSProperties}>
            Your academic life, <span className="soft">finally in one place.</span>
          </h1>
          <p className="hero-lead hero-enter" style={{ '--delay': '160ms' } as React.CSSProperties}>
            Acadence brings your Canvas courses, assignments, grades and announcements into one calm,
            customizable hub, so you always know what’s due and where you stand.
          </p>
          <div className="hero-ctas hero-enter" style={{ '--delay': '240ms' } as React.CSSProperties}>
            <a className="btn btn-primary" href="#early-access">
              Follow development <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="btn btn-secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>

        <div className="hero-stage hero-enter" style={{ '--delay': '320ms' } as React.CSSProperties}>
          <AppPreview label="The Acadence Home screen: a sidebar with Home, Courses, Grades, Tasks, Calendar and Announcements; a pinned lab report due today; upcoming assignments with due-date chips; and course cards showing current grades." />
          <div className="hero-float" aria-hidden="true">
            <div className="float-y">
              <NotificationStack />
            </div>
          </div>
        </div>
        <p className="hero-note" style={{ textAlign: 'center' }}>
          Recreated from the Acadence web app. Sample courses and data shown.
        </p>
      </div>
    </section>
  );
}
