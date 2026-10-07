import { Bell, BookOpen, Calculator, CalendarDays, GripVertical, Moon, Pin, RefreshCw, GraduationCap } from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Canvas sync',
    text: 'The Acadence Connector imports courses, assignments, grades, announcements and assignment groups, following Canvas pagination so nothing gets cut off.',
  },
  {
    icon: Bell,
    title: 'Change alerts',
    text: 'In-app notifications when something new is posted or a deadline, grade, point value or assignment group changes.',
  },
  {
    icon: GraduationCap,
    title: 'Grades & What-If',
    text: 'Current scores with group weights for every course, plus a What-If simulator that never writes back to Canvas.',
  },
  {
    icon: Calculator,
    title: 'GPA calculator',
    text: 'Estimate semester and cumulative GPA, including earlier courses pulled from your Canvas history.',
  },
  {
    icon: Pin,
    title: 'Pins & tasks',
    text: 'Pin the assignments that matter most and check off work yourself, even before Canvas shows it as submitted.',
  },
  {
    icon: CalendarDays,
    title: 'Deadline calendar',
    text: 'A month view of every due date with a day-by-day agenda, so busy weeks are obvious ahead of time.',
  },
  {
    icon: BookOpen,
    title: 'Course hubs',
    text: 'Each course has its own overview, syllabus, assignments and announcements, and course files open in Acadence.',
  },
  {
    icon: GripVertical,
    title: 'Your layout',
    text: 'Reorder Home widgets and navigation, choose which pages appear, and give each course its own cover image.',
  },
  {
    icon: Moon,
    title: 'Light & dark',
    text: 'Both themes are designed with care. Acadence follows your system setting, or you can choose one yourself.',
  },
];

export function Features() {
  return (
    <section id="features" className="section" aria-labelledby="features-title">
      <div className="container">
        <div className="section-head reveal">
          <span className="overline">Features</span>
          <h2 id="features-title" className="section-title">
            Small things that add up to a calmer semester.
          </h2>
          <p className="section-lead">Everything here works today in the current Acadence build.</p>
        </div>
        <ul className="features reveal">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="feature">
              <span className="icon-tile" aria-hidden="true">
                <Icon size={19} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
