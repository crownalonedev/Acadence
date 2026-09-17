import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { URL } from 'node:url';

const source = await readFile(new URL('../extension/sync.js', import.meta.url), 'utf8');
async function collect(failSecondPage = false) {
  const requests: string[] = [];
  const origin = 'https://school.instructure.com';
  const context = vm.createContext({ URL, Date, Map, Set, location: { origin }, fetch: async (path: string) => {
    const url = new URL(path, origin); requests.push(url.href);
    let rows: unknown = [], link = '', status = 200;
    if (url.pathname.endsWith('/profile')) rows = { id: 42, name: 'Student' };
    else if (url.pathname.endsWith('/courses')) rows = [{ id: 10, name: 'Course' }];
    else if (url.pathname.endsWith('/assignment_groups')) rows = [{ id: 5, name: 'Group', group_weight: 30 }];
    else if (url.pathname.endsWith('/assignments')) {
      if (url.searchParams.get('page') === '2') {
        status = failSecondPage ? 503 : 200;
        rows = [{ id: 2, name: 'Second page', assignment_group_id: 5, submission: { score: 0, grade: '0', workflow_state: 'graded', graded_at: '2026-09-15T00:00:00Z' } }];
      } else {
        rows = [{ id: 1, name: 'First page', assignment_group_id: 5, submission: { workflow_state: 'submitted', submitted_at: '2026-09-15T00:00:00Z' } }];
        link = `<${origin}/api/v1/courses/10/assignments?include[]=submission&page=2>; rel="next"`;
      }
    } else if (url.pathname.endsWith('/announcements')) rows = [{ id: 3, title: 'News', posted_at: '2026-09-15T00:00:00Z' }];
    return { ok: status === 200, status, json: async () => rows, headers: { get: (name: string) => name.toLowerCase() === 'link' ? link : null } };
  } });
  vm.runInContext(source, context);
  return { data: JSON.parse(JSON.stringify(await context.collectCanvasData())), requests };
}
test('collector follows pagination and includes real submission/zero grade data', async () => {
  const { data, requests } = await collect();
  assert.equal(data.assignments.length, 2);
  assert.equal(data.assignments[0].submissionState, 'submitted');
  assert.equal(data.grades[0].score, 0);
  assert.deepEqual(data.completeCourseIds.assignments, ['10']);
  assert.deepEqual(data.completeCourseIds.grades, ['10']);
  assert.ok(requests.some(url => url.includes('page=2')));
  const announcements = new URL(requests.find(url => url.includes('/announcements'))!);
  assert.equal(announcements.searchParams.get('start_date'), '1970-01-01T00:00:00.000Z');
  assert.ok(announcements.searchParams.has('end_date'));
  assert.equal(announcements.searchParams.has('active_only'), false);
});
test('failed later page discards the partial collection but keeps successful sources', async () => {
  const { data } = await collect(true);
  assert.equal(data.assignments.length, 0);
  assert.equal(data.grades.length, 0);
  assert.deepEqual(data.completeCourseIds.assignments, []);
  assert.deepEqual(data.completeCourseIds.grades, []);
  assert.equal(data.announcements.length, 1);
  assert.deepEqual(data.completeCourseIds.announcements, ['10']);
  assert.equal(data.assignmentGroups.length, 1);
});
