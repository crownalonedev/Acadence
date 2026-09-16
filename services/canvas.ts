export type CanvasProfile = { id: number; name: string; short_name?: string; sortable_name?: string; primary_email?: string };
export type CanvasCourse = { id: number; name: string; course_code?: string; workflow_state?: string; start_at?: string | null; end_at?: string | null };
export type CanvasAssignment = { id: number; course_id: number; name: string; due_at?: string | null; points_possible?: number | null; html_url?: string; submission?: { submitted_at?: string | null; workflow_state?: string } };
export type CanvasConnectionResult = { profile: CanvasProfile; courses: CanvasCourse[]; assignments: CanvasAssignment[] };

function normalizeBaseUrl(value: string) {
  const raw = value.trim().replace(/\/+$/, '');
  if (!raw) throw new Error('Enter your Canvas URL.');
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('Canvas must use HTTPS.');
  return url.origin;
}

async function request<T>(baseUrl: string, token: string, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}/api/v1${path}`, { headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' } });
  if (response.status === 401) throw new Error('Canvas rejected that access token.');
  if (response.status === 403) throw new Error('Your Canvas account does not allow access to that resource.');
  if (!response.ok) throw new Error(`Canvas returned ${response.status}. Check your Canvas URL and token.`);
  return response.json() as Promise<T>;
}

export async function connectCanvas(canvasUrl: string, token: string): Promise<CanvasConnectionResult> {
  if (!token.trim()) throw new Error('Enter a Canvas access token.');
  const baseUrl = normalizeBaseUrl(canvasUrl);
  const profile = await request<CanvasProfile>(baseUrl, token, '/users/self/profile');
  const courses = await request<CanvasCourse[]>(baseUrl, token, '/courses?enrollment_state=active&per_page=100');
  const assignmentGroups = await Promise.all(courses.map(async course => {
    try { return await request<CanvasAssignment[]>(baseUrl, token, `/courses/${course.id}/assignments?bucket=upcoming&include[]=submission&per_page=100`); }
    catch { return []; }
  }));
  return { profile, courses, assignments: assignmentGroups.flat() };
}
