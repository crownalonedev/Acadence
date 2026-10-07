// Sample data for the product previews. Field shapes and labels follow the Acadence app.
export type CoverId = 1 | 2 | 3 | 4;

export const courses = [
  { id: 'bio', code: 'BIO 201', name: 'Cell Biology', score: 93.4, letter: 'A', cover: 1 as CoverId, color: '#2F6B4F' },
  { id: 'math', code: 'MATH 241', name: 'Multivariable Calculus', score: 88.1, letter: 'B+', cover: 2 as CoverId, color: '#9A6A1B' },
  { id: 'engl', code: 'ENGL 110', name: 'Academic Writing', score: 96.0, letter: 'A', cover: 3 as CoverId, color: '#A65F3D' },
  { id: 'hist', code: 'HIST 150', name: 'Modern World History', score: 84.7, letter: 'B', cover: 4 as CoverId, color: '#1F5A44' },
];

export type Assignment = {
  id: string;
  name: string;
  course: string;
  label: string;
  exact: string;
  soon: boolean;
  points: number;
  pinned?: boolean;
};

export const assignments: Assignment[] = [
  { id: 'a1', name: 'Lab report 4: Enzyme kinetics', course: 'BIO 201', label: 'Due today', exact: 'Thu · 11:59 PM', soon: true, points: 40, pinned: true },
  { id: 'a2', name: 'Problem set 7', course: 'MATH 241', label: 'Due tomorrow', exact: 'Fri · 9:00 AM', soon: true, points: 25 },
  { id: 'a3', name: 'Argument essay — first draft', course: 'ENGL 110', label: 'Due in 3 days', exact: 'Sun · 11:59 PM', soon: false, points: 100 },
  { id: 'a4', name: 'Reading response: Chapter 12', course: 'HIST 150', label: 'Due in 5 days', exact: 'Tue · 2:00 PM', soon: false, points: 10 },
];

/** Notification kinds match the connector feed: assignment, change, grade, announcement, group. */
export const notifications = [
  { id: 'n1', kind: 'Grade posted', title: 'Quiz 5 · 18 / 20', body: 'MATH 241 · Multivariable Calculus', time: '2m' },
  { id: 'n2', kind: 'Due date changed', title: 'Problem set 7', body: 'Now due Fri 9:00 AM (was Thu 11:59 PM)', time: '1h' },
  { id: 'n3', kind: 'Announcement', title: 'Office hours moved to Room 204', body: 'BIO 201 · Cell Biology', time: '3h' },
  { id: 'n4', kind: 'New assignment', title: 'Reading response: Chapter 13', body: 'HIST 150 · Due next Tue', time: '5h' },
];

export const announcements = [
  {
    id: 'an1',
    title: 'Office hours moved to Room 204',
    meta: 'BIO 201 · Prof. Lindqvist · Today',
    body: 'Starting this week, Thursday office hours will be held in Room 204 of the science building. Same time, 3–4:30 PM. Bring your lab notebooks if you want feedback on report 4.',
  },
  {
    id: 'an2',
    title: 'Midterm review packet posted',
    meta: 'MATH 241 · Dr. Okafor · Yesterday',
    body: 'The review packet is now in Files under Week 8. Solutions will be posted Monday morning. The midterm covers sections 12.1 through 14.4.',
  },
  {
    id: 'an3',
    title: 'Peer review groups are live',
    meta: 'ENGL 110 · Ms. Ramirez · Mon',
    body: 'Check the Groups page for your peer review partners. Exchange drafts by Saturday so you have time to revise before Sunday night.',
  },
];
