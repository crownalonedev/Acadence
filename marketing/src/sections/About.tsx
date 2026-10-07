import { CircleCheck, CircleDashed } from 'lucide-react';

const built = [
  'Canvas sync through the Acadence Connector browser extension',
  'Customizable Home widgets and navigation',
  'Assignments, pins, tasks and a deadline calendar',
  'Grades with weights, What-If scores and a GPA calculator',
  'Announcements and in-app change notifications',
  'Course hubs with in-app file previews',
  'Light and dark themes, plus desktop and mobile layouts',
];

const next = [
  'Ask Acadence, an assistant for questions about your courses and materials',
  'A unified inbox for professor updates and grading notices',
  'A searchable library of course files',
  'Canvas sign-in with OAuth',
  'A public beta with accounts and hosted sync',
];

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <div className="about-copy reveal">
          <span className="overline">About</span>
          <h2 id="about-title" className="section-title">
            An honest look at where Acadence is.
          </h2>
          <p className="section-lead" style={{ marginInline: 'auto' }}>
            Acadence is an independent project for students who feel scattered across Canvas. The core app works
            today, but there isn’t a public release yet. Here’s what’s built and what’s next.
          </p>
        </div>
        <div className="status-grid">
          <div className="status-card reveal">
            <h3>
              <span className="icon-tile" aria-hidden="true">
                <CircleCheck size={19} />
              </span>
              Working today
            </h3>
            <ul>
              {built.map((b) => (
                <li key={b}>
                  <CircleCheck size={16} aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="status-card next reveal" style={{ '--delay': '80ms' } as React.CSSProperties}>
            <h3>
              <span className="icon-tile" aria-hidden="true">
                <CircleDashed size={19} />
              </span>
              In progress
            </h3>
            <ul>
              {next.map((b) => (
                <li key={b}>
                  <CircleDashed size={16} aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
