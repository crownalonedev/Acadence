import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calculateGrade,
  effectiveWeights,
  letterForScore,
  parseSyllabusGradingScheme,
} from '../utils/grading.ts';

test('parses plus/minus letter thresholds from syllabus text', () => {
  const course = {
    id: '1',
    name: 'Course',
    syllabusBody: `
      <h2>Grading Scale</h2>
      <p>A: 93-100%</p>
      <p>A-: 90-92%</p>
      <p>B+: 87-89%</p>
      <p>B: 83-86%</p>
      <p>B-: 80-82%</p>
      <p>C+: 77-79%</p>
      <p>C: 73-76%</p>
      <p>C-: 70-72%</p>
      <p>D: 60-69%</p>
      <p>F: 0-59%</p>
    `,
  };
  const scheme = parseSyllabusGradingScheme(course.syllabusBody);
  assert.equal(scheme.find((entry) => entry.name === 'A')?.value, 93);
  assert.equal(scheme.find((entry) => entry.name === 'A-')?.value, 90);
  assert.equal(scheme.find((entry) => entry.name === 'B+')?.value, 87);
  const letter = letterForScore(91.4, course as any);
  assert.equal(letter.letter, 'A-');
  assert.equal(letter.source, 'syllabus');
  assert.equal(letter.estimated, true);
});

test('uses Canvas assignment-group weights and normalizes active groups', () => {
  const course = {
    id: '1',
    name: 'Weighted',
    applyAssignmentGroupWeights: true,
  } as any;
  const groups = [
    { id: 'a', courseId: '1', name: 'Assignments', weight: 25 },
    { id: 'e', courseId: '1', name: 'Exams', weight: 75 },
  ] as any;
  assert.equal(effectiveWeights(course, groups).length, 2);
  const result = calculateGrade(
    course,
    [
      { id: '1', assignmentGroupId: 'a', score: 90, pointsPossible: 100 },
      { id: '2', assignmentGroupId: 'e', score: 80, pointsPossible: 100 },
    ],
    groups,
  );
  assert.equal(result.percent, 82.5);
  assert.equal(result.weighted, true);
});

test('uses complete syllabus weights when Canvas does not expose group weights', () => {
  const course = {
    id: '1',
    name: 'Syllabus weighted',
    syllabusWeights: [
      { name: 'Assignments', weight: 12.5 },
      { name: 'Quizzes', weight: 12.5 },
      { name: 'Midterm Exams', weight: 50 },
      { name: 'Final Exam', weight: 25 },
    ],
  } as any;
  const groups = [
    { id: '1', courseId: '1', name: 'Assignments', weight: 0 },
    { id: '2', courseId: '1', name: 'Quizzes', weight: 0 },
    { id: '3', courseId: '1', name: 'Midterm Exams', weight: 0 },
    { id: '4', courseId: '1', name: 'Final Exam', weight: 0 },
  ] as any;
  const weights = effectiveWeights(course, groups);
  assert.equal(weights.length, 4);
  assert.equal(weights.reduce((sum, item) => sum + item.weight, 0), 100);
  assert.equal(weights[0].source, 'syllabus');
});
