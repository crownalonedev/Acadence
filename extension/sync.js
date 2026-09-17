// Shared by the popup and automatic sync; each collection is committed only after all pages succeed.
async function collectCanvasData() {
  const syncedAt = new Date().toISOString();
  const request = async (path) => {
    const response = await fetch(path, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Canvas returned ${response.status}`);
    return response;
  };
  const list = async (path) => {
    const rows = [],
      visited = new Set();
    let next = new URL(path, location.origin).href;
    while (next) {
      if (new URL(next).origin !== location.origin || visited.has(next))
        throw new Error("Invalid Canvas pagination link.");
      visited.add(next);
      const response = await request(next),
        page = await response.json();
      if (!Array.isArray(page))
        throw new Error("Canvas returned an invalid list.");
      rows.push(...page);
      next =
        response.headers
          .get("Link")
          ?.match(/<([^>]+)>\s*;\s*rel="next"/i)?.[1] || "";
    }
    return rows;
  };
  const historyStart = (value) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed)
      ? new Date(parsed).toISOString()
      : "1970-01-01T00:00:00.000Z";
  };
  const normalizeScheme = (scheme) =>
    (Array.isArray(scheme) ? scheme : [])
      .map((entry) => {
        const raw = Number(entry?.value);
        return {
          name: String(entry?.name || "").trim(),
          value: Number.isFinite(raw) ? (raw <= 1.5 ? raw * 100 : raw) : NaN,
        };
      })
      .filter((entry) => entry.name && Number.isFinite(entry.value))
      .sort((a, b) => b.value - a.value);
  const extractSyllabusWeights = (html) => {
    const text = String(html || "")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    const matches = [];
    const pattern = /([A-Za-z][A-Za-z0-9 &/()'’.-]{1,50}?)\s*(?:[:\-–—]|\s)\s*(\d{1,3}(?:\.\d+)?)\s*%/g;
    let match;
    while ((match = pattern.exec(text))) {
      const name = match[1].replace(/^and\s+/i, "").trim(),
        weight = Number(match[2]);
      if (!name || !Number.isFinite(weight) || weight <= 0 || weight > 100)
        continue;
      if (/^(a[+-]?|b[+-]?|c[+-]?|d[+-]?|f|score|grade)$/i.test(name)) continue;
      const key = name.toLowerCase();
      if (!matches.some((item) => item.name.toLowerCase() === key))
        matches.push({ name, weight });
    }
    return matches.slice(0, 20);
  };
  const enrollmentFor = (course) =>
    Array.isArray(course?.enrollments) ? course.enrollments[0] || null : null;
  const courseGradeSummary = (course, enrollmentState) => {
    const e = enrollmentFor(course);
    return {
      id: String(course.id),
      name: course.name,
      courseCode: course.course_code,
      startAt: course.start_at,
      endAt: course.end_at,
      termName: course.term?.name || null,
      enrollmentState,
      currentScore:
        e?.computed_current_score ?? e?.current_grading_period_score ?? null,
      currentGrade:
        e?.computed_current_grade ?? e?.current_grading_period_grade ?? null,
      finalScore: e?.computed_final_score ?? null,
      finalGrade: e?.computed_final_grade ?? null,
    };
  };

  const profile = await (await request("/api/v1/users/self/profile")).json();
  const courses = await list(
    "/api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=current_grading_period_scores&include[]=syllabus_body&include[]=term&per_page=100",
  );
  let historicalCourseRows = [],
    historicalCoursesComplete = false;
  try {
    historicalCourseRows = await list(
      "/api/v1/courses?enrollment_state=completed&include[]=total_scores&include[]=term&per_page=100",
    );
    historicalCoursesComplete = true;
  } catch {
    /* Some Canvas instances restrict concluded-course history. Keep the prior snapshot. */
  }
  const activeCourseIds = new Set(courses.map((course) => String(course.id)));
  const historicalCourses = historicalCourseRows
    .filter((course) => !activeCourseIds.has(String(course.id)))
    .map((course) => courseGradeSummary(course, "completed"))
    .sort(
      (a, b) =>
        Date.parse(b.endAt || b.startAt || 0) - Date.parse(a.endAt || a.startAt || 0),
    );

  const assignments = [],
    announcements = [],
    grades = [],
    assignmentGroups = [],
    modules = [],
    files = [],
    pages = [],
    gradingSchemes = new Map();
  const completeCourseIds = {
    assignments: [],
    announcements: [],
    grades: [],
    assignmentGroups: [],
    modules: [],
    files: [],
    pages: [],
  };

  for (const course of courses) {
    const courseId = String(course.id);

    if (course.grading_standard_id != null) {
      try {
        const standard = await (
          await request(
            `/api/v1/courses/${course.id}/grading_standards/${course.grading_standard_id}`,
          )
        ).json();
        gradingSchemes.set(courseId, normalizeScheme(standard?.grading_scheme));
      } catch {
        /* Some institutions hide grading-standard details from students. */
      }
    }

    try {
      const groups = await list(
        `/api/v1/courses/${course.id}/assignment_groups?per_page=100`,
      );
      assignmentGroups.push(
        ...groups.map((group) => ({
          id: String(group.id),
          courseId,
          name: group.name,
          weight: Number(group.group_weight) || 0,
          rules: group.rules || {},
          position: group.position,
        })),
      );
      completeCourseIds.assignmentGroups.push(courseId);
    } catch {
      /* Keep the last successful group snapshot. */
    }

    try {
      const rows = await list(
        `/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=100`,
      );
      for (const a of rows) {
        if (a.published === false) continue;
        const sub = a.submission || {},
          assignmentGroupId =
            a.assignment_group_id == null
              ? undefined
              : String(a.assignment_group_id);
        assignments.push({
          id: String(a.id),
          courseId,
          assignmentGroupId,
          name: a.name,
          description: a.description || "",
          dueAt: a.due_at,
          pointsPossible: a.points_possible,
          gradingType: a.grading_type,
          omitFromFinalGrade: !!a.omit_from_final_grade,
          htmlUrl: a.html_url,
          submissionState: sub.workflow_state || null,
          submittedAt: sub.submitted_at || null,
          gradedAt: sub.graded_at || null,
          excused: !!sub.excused,
          missing: !!sub.missing,
          late: !!sub.late,
        });
        if (sub.score != null || sub.grade != null || sub.excused)
          grades.push({
            id: `${course.id}:${a.id}`,
            courseId,
            assignmentId: String(a.id),
            assignmentGroupId,
            name: a.name,
            score: sub.score,
            grade: sub.grade,
            pointsPossible: a.points_possible,
            gradingType: a.grading_type,
            omitFromFinalGrade: !!a.omit_from_final_grade,
            gradedAt: sub.graded_at,
            submittedAt: sub.submitted_at,
            excused: !!sub.excused,
            late: !!sub.late,
            missing: !!sub.missing,
            htmlUrl: a.html_url,
          });
      }
      completeCourseIds.assignments.push(courseId);
      completeCourseIds.grades.push(courseId);
    } catch {
      /* Do not replace good assignment/grade data with an empty failed fetch. */
    }

    try {
      const startDate = historyStart(course.start_at);
      const rows = await list(
        `/api/v1/announcements?context_codes[]=course_${course.id}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(syncedAt)}&per_page=100`,
      );
      announcements.push(
        ...rows.map((a) => ({
          id: String(a.id),
          courseId,
          title: a.title,
          message: a.message || "",
          postedAt: a.posted_at || a.created_at,
          author: a.author?.display_name || a.author?.name || "",
          htmlUrl: a.html_url || a.url,
        })),
      );
      completeCourseIds.announcements.push(courseId);
    } catch {
      /* Preserve the previous announcement snapshot on failure. */
    }

    try {
      const rows = await list(
        `/api/v1/courses/${course.id}/modules?include[]=items&per_page=100`,
      );
      modules.push(
        ...rows.map((module) => ({
          id: String(module.id),
          courseId,
          name: module.name,
          position: module.position,
          state: module.state,
          unlockAt: module.unlock_at,
          prerequisiteModuleIds: (module.prerequisite_module_ids || []).map(String),
          items: (Array.isArray(module.items) ? module.items : []).map((item) => ({
            id: String(item.id),
            moduleId: String(module.id),
            title: item.title,
            type: item.type,
            position: item.position,
            indent: item.indent || 0,
            contentId: item.content_id == null ? undefined : String(item.content_id),
            pageUrl: item.page_url,
            htmlUrl: item.html_url,
            completionRequirement: item.completion_requirement || null,
          })),
        })),
      );
      completeCourseIds.modules.push(courseId);
    } catch {
      /* Preserve the previous module snapshot on failure. */
    }

    try {
      const rows = await list(`/api/v1/courses/${course.id}/files?per_page=100`);
      for (const file of rows) {
        let publicUrl;
        try {
          const result = await (
            await request(`/api/v1/files/${file.id}/public_url`)
          ).json();
          publicUrl = result?.public_url;
        } catch {
          /* A Canvas instance may not expose public inline URLs for every file. */
        }
        files.push({
          id: String(file.id),
          courseId,
          displayName: file.display_name || file.filename || "File",
          filename: file.filename,
          contentType: file["content-type"] || file.content_type,
          size: file.size,
          updatedAt: file.updated_at || file.created_at,
          downloadUrl: file.url,
          previewUrl: file.preview_url,
          publicUrl,
          htmlUrl: `${location.origin}/courses/${course.id}/files/${file.id}`,
        });
      }
      completeCourseIds.files.push(courseId);
    } catch {
      /* Preserve the previous file snapshot on failure. */
    }

    try {
      const rows = await list(`/api/v1/courses/${course.id}/pages?per_page=100`);
      for (const page of rows.filter((page) => page.published !== false)) {
        let body = "";
        try {
          const detail = await (
            await request(
              `/api/v1/courses/${course.id}/pages/${encodeURIComponent(page.url)}`,
            )
          ).json();
          body = detail?.body || "";
        } catch {
          /* Keep the page listing even if its body is unavailable. */
        }
        pages.push({
          id: String(page.page_id ?? page.url),
          courseId,
          title: page.title,
          url: page.url,
          body,
          updatedAt: page.updated_at || page.created_at,
          frontPage: !!page.front_page,
          htmlUrl: `${location.origin}/courses/${course.id}/pages/${encodeURIComponent(page.url)}`,
        });
      }
      completeCourseIds.pages.push(courseId);
    } catch {
      /* Preserve the previous page snapshot on failure. */
    }
  }

  return {
    source: "canvas",
    canvasOrigin: location.origin,
    profile: { id: String(profile.id), name: profile.name },
    courses: courses.map((c) => {
      const summary = courseGradeSummary(c, "active");
      return {
        ...summary,
        syllabusBody: c.syllabus_body || "",
        syllabusWeights: extractSyllabusWeights(c.syllabus_body),
        applyAssignmentGroupWeights: !!c.apply_assignment_group_weights,
        gradingStandardId:
          c.grading_standard_id == null ? undefined : String(c.grading_standard_id),
        gradingScheme: gradingSchemes.get(String(c.id)) || [],
      };
    }),
    historicalCourses,
    historicalCoursesComplete,
    assignments,
    announcements,
    grades,
    assignmentGroups,
    modules,
    files,
    pages,
    completeCourseIds,
    syncedAt,
  };
}
