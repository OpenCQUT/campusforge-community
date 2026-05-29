const COURSES_KEY = "cf_courses_progress";

export interface CourseProgress {
  id: string;
  title: string;
  startedAt: string;
  completedAt: string | null;
}

export function getCourseProgress(): CourseProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    return raw ? (JSON.parse(raw) as CourseProgress[]) : [];
  } catch {
    return [];
  }
}

export function startCourse(id: string, title: string) {
  const all = getCourseProgress();
  if (all.some((c) => c.id === id)) return;
  all.push({ id, title, startedAt: new Date().toISOString().slice(0, 10), completedAt: null });
  localStorage.setItem(COURSES_KEY, JSON.stringify(all));
}

export function completeCourse(id: string) {
  const all = getCourseProgress();
  const idx = all.findIndex((c) => c.id === id);
  const existing = all[idx];
  if (!existing || existing.completedAt) return;
  existing.completedAt = new Date().toISOString().slice(0, 10);
}

export function isCourseStarted(id: string): boolean {
  return getCourseProgress().some((c) => c.id === id);
}

export function isCourseCompleted(id: string): boolean {
  return getCourseProgress().some((c) => c.id === id && c.completedAt !== null);
}
