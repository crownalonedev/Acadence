import { BookOpen, CalendarDays, CircleUserRound, GraduationCap, House, ListTodo, Megaphone, Moon, Pencil, Pin, Sparkles, Sun } from 'lucide-react';
import { BellIcon } from './BellIcon';
import { BrandMark } from '../components/Brand';
import { AssignmentRow } from './AssignmentRow';
import { CourseCard } from './CourseCard';
import { assignments, courses } from './data';

const nav = [
  { label: 'Home', icon: House, active: true },
  { label: 'Courses', icon: BookOpen },
  { label: 'Grades', icon: GraduationCap },
  { label: 'Tasks', icon: ListTodo },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Announcements', icon: Megaphone },
];
const tabs = [
  { label: 'Home', icon: House, active: true },
  { label: 'Courses', icon: BookOpen },
  { label: 'Grades', icon: GraduationCap },
  { label: 'Tasks', icon: ListTodo },
  { label: 'You', icon: CircleUserRound },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * HTML recreation of the Acadence Home screen. Uses a container query to switch between the
 * desktop sidebar layout and the mobile tab-bar layout, the same split the app makes at 900px.
 */
export function AppPreview({ label, rows = 3 }: { label: string; rows?: number }) {
  const pinned = assignments.filter((a) => a.pinned);
  const upcoming = assignments.filter((a) => !a.pinned).slice(0, rows);
  return (
    <figure className="app-frame" role="img" aria-label={label} style={{ margin: 0 }}>
      <div className="app-chrome" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="app-body" aria-hidden="true">
        <aside className="app-sidebar">
          <BrandMark />
          <div className="app-semester">Current semester</div>
          <div className="app-nav">
            {nav.map(({ label, icon: Icon, active }) => (
              <div key={label} className={`app-nav-item${active ? ' active' : ''}`}>
                <Icon size={17} />
                {label}
              </div>
            ))}
          </div>
          <div className="app-ask">
            <Sparkles size={16} color="var(--accent)" />
            <div>
              <strong>Ask Acadence</strong>
              <span>Your academic assistant</span>
            </div>
          </div>
        </aside>
        <div className="app-main">
          <div className="app-top">
            <div>
              <div className="app-greeting">{greeting()}, Sam.</div>
              <div className="app-sub">Synced with Canvas · {courses.length} courses</div>
            </div>
            <div className="app-actions">
              <span className="app-round hide-compact" style={{ color: 'var(--accent)' }}>
                <Sun size={17} className="icon-light" />
                <Moon size={17} className="icon-dark" />
              </span>
              <span className="app-round">
                <BellIcon size={17} />
                <span className="app-badge">4</span>
              </span>
              <span className="app-round hide-compact">
                <Pencil size={16} />
              </span>
            </div>
          </div>
          <div className="app-cols">
            <div>
              <div className="w-insight">
                <Sparkles size={19} />
                <div>
                  <strong>Acadence</strong>
                  <span>
                    {assignments.length} upcoming assignments across {courses.length} courses.
                  </span>
                </div>
              </div>
              <div className="w-pin-heading">
                <Pin size={12} fill="currentColor" /> PINNED ASSIGNMENTS
              </div>
              {pinned.map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
              <div className="w-heading">Needs your attention</div>
              {upcoming.map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
            </div>
            <div className="col-courses">
              <div className="w-heading" style={{ marginTop: 0 }}>
                Your courses
              </div>
              <div className="course-grid">
                {courses.map((c) => (
                  <CourseCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <nav className="app-tabbar">
          {tabs.map(({ label, icon: Icon, active }) => (
            <span key={label} className={active ? 'active' : undefined}>
              <Icon size={20} />
              {label}
            </span>
          ))}
        </nav>
      </div>
    </figure>
  );
}
