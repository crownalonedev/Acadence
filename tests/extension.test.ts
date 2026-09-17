import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { URL } from 'node:url';

const source = await readFile(new URL('../extension/sync.js', import.meta.url), 'utf8');
async function collect(failSecondPage = false) {
  const requests: string[] = [];
  const origin = 'https://school.instructure.com';
  const context = vm.createContext({
    URL,
    Date,
    Map,
    Set,
    location: { origin },
    fetch: async (path: string) => {
      const url = new URL(path, origin);
      requests.push(url.href);
      let rows: unknown = [],
        link = '',
        status = 200;
      if (url.pathname.endsWith('/profile')) rows = { id: 42, name: 'Student' };
      else if (url.pathname.endsWith('/courses')) {
        if (url.searchParams.get('enrollment_state') === 'completed') {
          rows = [
            {
              id: 9,
              name: 'Previous Course',
              course_code: 'OLD 101',
              start_at: '2025-08-20T00:00:00Z',
              end_at: '2025-12-15T00:00:00Z',
              term: { name: 'Fall 2025' },
              enrollments: [
                {
                  computed_current_score: 91,
                  computed_current_grade: 'A-',
                  computed_final_score: 90,
                  computed_final_grade: 'A-',
                },
              ],
            },
          ];
        } else {
          rows = [
            {
              id: 10,
              name: 'Course',
              course_code: 'CUR 100',
              term: { name: 'Fall 2026' },
              syllabus_body: '<h2>Course Description</h2><p>Welcome</p>',
              grading_standard_id: 77,
              apply_assignment_group_weights: true,
              enrollments: [
                {
                  computed_current_score: 95,
                  computed_current_grade: 'A',
                },
              ],
            },
          ];
        }
      }
      else if (url.pathname.endsWith('/grading_standards/77'))
        rows = {
          grading_scheme: [
            { name: 'A', value: 0.9 },
            { name: 'B', value: 0.8 },
            { name: 'C', value: 0.7 },
          ],
        };
      else if (url.pathname.endsWith('/assignment_groups'))
        rows = [{ id: 5, name: 'Group', group_weight: 30 }];
      else if (url.pathname.endsWith('/assignments')) {
        if (url.searchParams.get('page') === '2') {
          status = failSecondPage ? 503 : 200;
          rows = [
            {
              id: 2,
              name: 'Second page',
              assignment_group_id: 5,
              grading_type: 'points',
              submission: {
                score: 0,
                grade: '0',
                workflow_state: 'graded',
                graded_at: '2026-09-15T00:00:00Z',
              },
            },
          ];
        } else {
          rows = [
            {
              id: 1,
              name: 'First page',
              assignment_group_id: 5,
              grading_type: 'points',
              submission: {
                workflow_state: 'submitted',
                submitted_at: '2026-09-15T00:00:00Z',
              },
            },
          ];
          link = `<${origin}/api/v1/courses/10/assignments?include[]=submission&page=2>; rel="next"`;
        }
      } else if (url.pathname.endsWith('/announcements'))
        rows = [{ id: 3, title: 'News', posted_at: '2026-09-15T00:00:00Z' }];
      else if (url.pathname.endsWith('/modules'))
        rows = [
          {
            id: 7,
            name: 'Week 1',
            position: 1,
            items: [
              {
                id: 70,
                title: 'Lecture',
                type: 'Page',
                html_url: `${origin}/courses/10/modules/items/70`,
              },
            ],
          },
        ];
      else if (url.pathname.endsWith('/files'))
        rows = [
          {
            id: 8,
            display_name: 'notes.pdf',
            filename: 'notes.pdf',
            size: 2048,
            'content-type': 'application/pdf',
            url: `${origin}/files/8/download?download_frd=1`,
            preview_url: `${origin}/courses/10/files/8/preview`,
          },
        ];
      else if (url.pathname.endsWith('/pages'))
        rows = [
          {
            page_id: 9,
            url: 'welcome',
            title: 'Welcome',
            published: true,
            front_page: true,
          },
        ];
      return {
        ok: status === 200,
        status,
        json: async () => rows,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'link' ? link : null,
        },
      };
    },
  });
  vm.runInContext(source, context);
  return {
    data: JSON.parse(JSON.stringify(await context.collectCanvasData())),
    requests,
  };
}

test('collector follows pagination and includes course content plus current and historical grade data', async () => {
  const { data, requests } = await collect();
  assert.equal(data.assignments.length, 2);
  assert.equal(data.assignments[0].submissionState, 'submitted');
  assert.equal(data.assignments[0].gradingType, 'points');
  assert.equal(data.grades[0].score, 0);
  assert.equal(data.courses[0].syllabusBody.includes('Course Description'), true);
  assert.equal(data.courses[0].gradingScheme[0].name, 'A');
  assert.equal(data.courses[0].gradingScheme[0].value, 90);
  assert.equal(data.courses[0].currentGrade, 'A');
  assert.equal(data.courses[0].termName, 'Fall 2026');
  assert.equal(data.historicalCourses.length, 1);
  assert.equal(data.historicalCourses[0].courseCode, 'OLD 101');
  assert.equal(data.historicalCourses[0].finalGrade, 'A-');
  assert.equal(data.historicalCourses[0].finalScore, 90);
  assert.equal(data.historicalCourses[0].termName, 'Fall 2025');
  assert.equal(data.historicalCoursesComplete, true);
  assert.equal(data.modules[0].name, 'Week 1');
  assert.equal(data.modules[0].items[0].title, 'Lecture');
  assert.equal(data.files[0].displayName, 'notes.pdf');
  assert.equal(data.files[0].downloadUrl, 'https://school.instructure.com/files/8/download?download_frd=1');
  assert.equal(data.files[0].previewUrl, 'https://school.instructure.com/courses/10/files/8/preview');
  assert.equal(data.pages[0].title, 'Welcome');
  assert.deepEqual(data.completeCourseIds.assignments, ['10']);
  assert.deepEqual(data.completeCourseIds.grades, ['10']);
  assert.deepEqual(data.completeCourseIds.modules, ['10']);
  assert.deepEqual(data.completeCourseIds.files, ['10']);
  assert.deepEqual(data.completeCourseIds.pages, ['10']);
  assert.ok(requests.some((url) => url.includes('page=2')));
  assert.ok(
    requests.some(
      (url) => url.includes('/modules') && url.includes('include%5B%5D=items'),
    ),
  );
  assert.ok(
    requests.some(
      (url) => url.includes('/courses') && url.includes('enrollment_state=completed'),
    ),
  );
  const announcements = new URL(
    requests.find((url) => url.includes('/announcements'))!,
  );
  assert.equal(
    announcements.searchParams.get('start_date'),
    '1970-01-01T00:00:00.000Z',
  );
  assert.ok(announcements.searchParams.has('end_date'));
  assert.equal(announcements.searchParams.has('active_only'), false);
});

test('failed later assignment page discards that partial collection but keeps successful course content', async () => {
  const { data } = await collect(true);
  assert.equal(data.assignments.length, 0);
  assert.equal(data.grades.length, 0);
  assert.deepEqual(data.completeCourseIds.assignments, []);
  assert.deepEqual(data.completeCourseIds.grades, []);
  assert.equal(data.announcements.length, 1);
  assert.deepEqual(data.completeCourseIds.announcements, ['10']);
  assert.equal(data.assignmentGroups.length, 1);
  assert.equal(data.modules.length, 1);
  assert.equal(data.files.length, 1);
  assert.equal(data.pages.length, 1);
  assert.equal(data.historicalCourses.length, 1);
});
