import { Bell, CalendarDays, GraduationCap, LayoutList, ListTodo, Megaphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { AssignmentRow } from '../product/AssignmentRow';
import { GradeCard } from '../product/GradeCard';
import { MiniCalendar } from '../product/MiniCalendar';
import { Announcements } from '../product/Announcements';
import { NotificationStack } from '../product/NotificationStack';
import { Tasks } from '../product/Tasks';
import { assignments } from '../product/data';

function Tile({ icon, title, text, className, children, delay = 0 }: { icon: ReactNode; title: string; text: string; className: string; children: ReactNode; delay?: number }) {
  return (
    <article className={`tile reveal ${className}`} style={{ '--delay': `${delay}ms` } as React.CSSProperties}>
      <div className="tile-head">
        <span className="icon-tile" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>
      <div className="tile-demo">{children}</div>
    </article>
  );
}

export function Showcase() {
  return (
    <section id="product" className="section" aria-labelledby="product-title">
      <div className="container">
        <div className="section-head reveal">
          <span className="overline">The product</span>
          <h2 id="product-title" className="section-title">
            Everything Canvas scatters, gathered on one screen.
          </h2>
          <p className="section-lead">
            Deadlines, grades and course updates usually live in different tabs, menus and emails. Acadence
            syncs them once and puts them where you’ll actually see them.
          </p>
        </div>

        <div className="bento">
          <Tile
            className="span-4"
            icon={<LayoutList size={19} />}
            title="Needs your attention"
            text="Upcoming work from every course, sorted by due date. Pin what matters most so it stays on top."
          >
            <div className="demo-split">
              {assignments.map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
            </div>
          </Tile>
          <Tile
            className="span-2"
            icon={<Bell size={19} />}
            title="Know what changed"
            text="New assignments, moved deadlines, posted grades and announcements, without having to check."
            delay={80}
          >
            <NotificationStack interactive count={4} />
          </Tile>
          <Tile
            className="span-3"
            icon={<GraduationCap size={19} />}
            title="Grades, with context"
            text="See each course’s grade and weighting, and try What-If scores before the final."
          >
            <GradeCard />
          </Tile>
          <Tile
            className="span-3"
            icon={<CalendarDays size={19} />}
            title="Every deadline on a calendar"
            text="Assignments mapped by due date across all your courses, color-coded by class."
            delay={80}
          >
            <MiniCalendar />
          </Tile>
          <Tile
            className="span-3"
            icon={<Megaphone size={19} />}
            title="Announcements in one feed"
            text="Updates from every current course, newest first, readable in a tap."
          >
            <Announcements />
          </Tile>
          <Tile
            className="span-3"
            icon={<ListTodo size={19} />}
            title="Check it off"
            text="Mark work done in Acadence, even before Canvas catches up. Try it."
            delay={80}
          >
            <Tasks />
          </Tile>
        </div>
      </div>
    </section>
  );
}
