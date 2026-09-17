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
      else if (url.pathname.endsWith('/courses'))
        rows = [
          {
            id: 10,
            name: 'Course',
            syllabus_body: '<h2>Course Description</h2><p>Welcome</p>',
            grading_standard_id: 77,
            apply_assignment_group_weights: true,
          },
        ];
      else if (url.pathname.endsWith('/grading_standards/77'))
        rows = {
          id: 77,
          grading_scheme: [
            { name: 'A', value: 0.93 },
            { name: 'A-', value: 0.9 },
            { name: 'B+', value: 0.87 },
          ],
        };
      else if (url.pathname.endsWith('/assignment_groups'))
        rows = [{ id: 5, name: 'Projects', group_weight: 30, rules: { drop_lowest: 1 } }];
      else if (url.pathname.endsWith('/assignments')) {
        if (url.searchParams.get('page') === '2') {
          status = failSecondPage ? 503 : 200;
          rows = [
            {
              id: 2,
              name: 'Second page',
              assignment_group_id: 5,
              points_possible: 50,
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
              points_possible: 50,
              grading_type: 'points',
              omit_from_final_grade: false,
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
          get: (name: string) => (name.toLowerCase() === 'link' ? link : null),
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

test('collector follows pagination and includes course content, weights, grading scheme and real submission data', async () => {
  const { data, requests } = await collect();
  assert.equal(data.assignments.length, 2);
  assert.equal(data.assignments[0].submissionState, 'submitted');
  assert.equal(data.assignments[0].gradingType, 'points');
  assert.equal(data.assignments[0].omitFromFinalGrade, false);
  assert.equal(data.grades[0].score, 0);
  assert.equal(data.grades[0].gradingType, 'points');
  assert.equal(data.courses[0].syllabusBody, '<h2>Course Description</h2><p>Welcome</p>');
  assert.equal(data.courses[0].applyAssignmentGroupWeights, true);
  assert.equal(data.courses[0].gradingStandardId, '77');
  assert.deepEqual(data.courses[0].gradingScheme, [
    { name: 'A', value: 93 },
    { name: 'A-', value: 90 },
    { name: 'B+', value: 87 },
  ]);
  assert.equal(data.assignmentGroups[0].weight, 30);
  assert.equal(data.assignmentGroups[0].rules.drop_lowest, 1);
  assert.equal(data.modules[0].name, 'Week 1');
  assert.equal(data.modules[0].items[0].title, 'Lecture');
  assert.equal(data.files[0].displayName, 'notes.pdf');
  assert.equal(data.pages[0].title, 'Welcome');
  assert.deepEqual(data.completeCourseIds.assignments, ['10']);
  assert.deepEqual(data.completeCourseIds.grades, ['10']);
  assert.deepEqual(data.completeCourseIds.modules, ['10']);
  assert.deepEqual(data.completeCourseIds.files, ['10']);
  assert.deepEqual(data.completeCourseIds.pages, ['10']);
  assert.ok(requests.some((url) => url.includes('page=2')));
  assert.ok(requests.some((url) => url.includes('/grading_standards/77')));
  assert.ok(
    requests.some(
      (url) => url.includes('/modules') && url.includes('include%5B%5D=items'),
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
  assert.equal(data.courses[0].gradingScheme[0].name, 'A');
});
