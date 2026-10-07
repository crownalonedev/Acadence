import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, EyeOff, GraduationCap, GripVertical, Pin, Plus, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { AssignmentRow } from '../product/AssignmentRow';
import { CourseCard } from '../product/CourseCard';
import { assignments, courses } from '../product/data';

// Widget ids, labels, descriptions and defaults match context/HomeLayoutContext.tsx
type WidgetId = 'insight' | 'attention' | 'courses' | 'schedule' | 'changes' | 'grades';
const widgets: Record<WidgetId, { label: string; description: string }> = {
  insight: { label: 'Acadence insight', description: 'Smart overview of what matters now.' },
  attention: { label: 'Needs attention', description: 'Assignments and deadlines that need action.' },
  courses: { label: 'Your courses', description: 'Quick access to current courses.' },
  schedule: { label: "Today's schedule", description: 'Classes and events happening today.' },
  changes: { label: 'Recent changes', description: 'New grades, files, and changed due dates.' },
  grades: { label: 'Grade snapshot', description: 'A quick look at current grades.' },
};
const DEFAULT_ITEMS: WidgetId[] = ['insight', 'attention', 'courses'];
const DEFAULT_HIDDEN: WidgetId[] = ['schedule', 'changes', 'grades'];

function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case 'insight':
      return (
        <div className="w-insight">
          <Sparkles size={19} />
          <div>
            <strong>Acadence</strong>
            <span>
              {assignments.length} upcoming assignments across {courses.length} courses.
            </span>
          </div>
        </div>
      );
    case 'attention':
      return (
        <div>
          <div className="w-pin-heading" style={{ marginTop: 0 }}>
            <Pin size={12} fill="currentColor" /> PINNED ASSIGNMENTS
          </div>
          <AssignmentRow a={assignments[0]} />
          <div className="w-heading" style={{ marginTop: 12 }}>
            Needs your attention
          </div>
          <AssignmentRow a={assignments[1]} />
        </div>
      );
    case 'courses':
      return (
        <div>
          <div className="w-heading" style={{ marginTop: 0 }}>
            Your courses
          </div>
          <div className="course-grid">
            {courses.slice(0, 2).map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      );
    case 'schedule':
      return (
        <div className="simple-widget">
          <CalendarDays size={20} />
          <b>Calendar & deadlines</b>
        </div>
      );
    case 'changes':
      return (
        <div className="simple-widget">
          <RefreshCw size={20} />
          <b>Refresh Canvas</b>
        </div>
      );
    case 'grades':
      return (
        <div className="simple-widget">
          <GraduationCap size={20} />
          <b>Grades & What-If</b>
        </div>
      );
  }
}

/** FLIP: animate items from their previous position to the new one after a reorder. */
function useFlip(keys: string[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const last = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodes.current.forEach((el, key) => {
      const prev = last.current.get(key);
      const next = el.getBoundingClientRect();
      if (prev && !reduce) {
        const dy = prev.top - next.top;
        if (Math.abs(dy) > 1) {
          el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
            duration: 420,
            easing: 'cubic-bezier(.2,.8,.2,1)',
          });
        }
      }
      last.current.set(key, next);
    });
  }, [keys.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  };
}

export function Customize() {
  const [items, setItems] = useState<WidgetId[]>(DEFAULT_ITEMS);
  const [hidden, setHidden] = useState<WidgetId[]>(DEFAULT_HIDDEN);
  const [announce, setAnnounce] = useState('');
  const listRef = useFlip(items.map((i) => `l-${i}`));
  const previewRef = useFlip(items.map((i) => `p-${i}`));

  const move = (id: WidgetId, dir: -1 | 1) => {
    const from = items.indexOf(id);
    const to = from + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    next.splice(from, 1);
    next.splice(to, 0, id);
    setItems(next);
    setAnnounce(`${widgets[id].label} moved to position ${to + 1} of ${next.length}.`);
  };
  const hide = (id: WidgetId) => {
    setItems((x) => x.filter((v) => v !== id));
    setHidden((x) => [...x, id]);
    setAnnounce(`${widgets[id].label} removed from Home.`);
  };
  const show = (id: WidgetId) => {
    setHidden((x) => x.filter((v) => v !== id));
    setItems((x) => [...x, id]);
    setAnnounce(`${widgets[id].label} added to Home.`);
  };
  const reset = () => {
    setItems(DEFAULT_ITEMS);
    setHidden(DEFAULT_HIDDEN);
    setAnnounce('Home reset to default widgets.');
  };

  return (
    <section id="customize" className="section" aria-labelledby="customize-title">
      <div className="container">
        <div className="section-head center reveal">
          <span className="overline">Customizable Home</span>
          <h2 id="customize-title" className="section-title">
            Arrange Acadence around what you care about.
          </h2>
          <p className="section-lead">
            Home is made of widgets. Add the ones you want, hide the rest and put them in your order. Drag
            to rearrange on the web. The sidebar works the same way, so your most-used pages sit at the top.
          </p>
        </div>

        <div className="customize">
          <div className="sheet reveal">
            <div className="sheet-handle" aria-hidden="true" />
            <h3>Customize Home</h3>
            <p className="sheet-sub">Try it: reorder, hide or add a widget.</p>

            <h4 className="sheet-label" id="your-widgets">
              YOUR WIDGETS
            </h4>
            <ul className="w-list" aria-labelledby="your-widgets">
              {items.map((id, i) => (
                <li key={id} ref={listRef(`l-${id}`)} className="w-item">
                  <GripVertical size={20} className="grip" aria-hidden="true" />
                  <div className="w-item-text">
                    <b>{widgets[id].label}</b>
                    <small>{widgets[id].description}</small>
                  </div>
                  <button type="button" className="w-ctrl" onClick={() => move(id, -1)} aria-disabled={i === 0} aria-label={`Move ${widgets[id].label} up`}>
                    <ArrowUp size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="w-ctrl"
                    onClick={() => move(id, 1)}
                    aria-disabled={i === items.length - 1}
                    aria-label={`Move ${widgets[id].label} down`}
                  >
                    <ArrowDown size={17} aria-hidden="true" />
                  </button>
                  <button type="button" className="w-ctrl" onClick={() => hide(id)} aria-label={`Hide ${widgets[id].label}`}>
                    <EyeOff size={17} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            {hidden.length > 0 ? (
              <>
                <h4 className="sheet-label" id="add-widgets">
                  ADD TO HOME
                </h4>
                <ul className="w-list" aria-labelledby="add-widgets">
                  {hidden.map((id) => (
                    <li key={id}>
                      <button type="button" className="w-item w-add" onClick={() => show(id)}>
                        <Plus size={20} className="plus" aria-hidden="true" />
                        <span className="w-item-text">
                          <b>{widgets[id].label}</b>
                          <small>{widgets[id].description}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <div className="sheet-foot">
              <button type="button" className="reset-btn" onClick={reset}>
                <RotateCcw size={15} aria-hidden="true" /> Reset
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>
          </div>

          <div className="reveal" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <div className="live-label">
              <span className="live-dot" aria-hidden="true" /> Live Home preview
            </div>
            <div className="home-preview" aria-hidden="true">
              <div className="app-greeting">Your Home</div>
              <div className="app-sub">Synced with Canvas · {courses.length} courses</div>
              <div className="hp-widgets">
                {items.length === 0 ? <div className="empty-home">No widgets yet. Add one from the list.</div> : null}
                {items.map((id) => (
                  <div key={id} ref={previewRef(`p-${id}`)} className="hp-widget-enter">
                    <Widget id={id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
