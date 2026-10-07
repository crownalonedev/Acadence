import type { courses } from './data';

export function CourseCard({ c }: { c: (typeof courses)[number] }) {
  return (
    <div className="course-card">
      <div className={`course-cover cover-${c.cover}`}>
        <span className="course-grade">
          {c.score}% · {c.letter}
        </span>
      </div>
      <div className="course-body">
        <div className="course-code">{c.code}</div>
        <div className="course-name">{c.name}</div>
      </div>
    </div>
  );
}
