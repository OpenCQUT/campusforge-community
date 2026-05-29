const STORAGE_KEY = "cf_applications";

export interface StoredApplication {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  reason: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  submittedAt: string;
  reviewNote: string;
}

function readAll(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredApplication[]) : [];
  } catch {
    return [];
  }
}

function writeAll(apps: StoredApplication[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getAllApplications(): StoredApplication[] {
  return readAll();
}

export function getApplicationByEmail(email: string): StoredApplication | null {
  return readAll().find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function addApplication(input: {
  email: string;
  studentId: string;
  department: string;
  reason: string;
}): StoredApplication {
  const all = readAll();
  const existing = all.find((a) => a.email.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("duplicate");

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const app: StoredApplication = {
    id: `app-${Date.now()}`,
    name: input.email.split("@")[0] ?? input.email,
    email: input.email,
    studentId: input.studentId,
    department: input.department,
    reason: input.reason,
    status: "SUBMITTED",
    submittedAt: dateStr,
    reviewNote: "",
  };
  all.push(app);
  writeAll(all);
  return app;
}

export function updateApplication(id: string, updates: Partial<Pick<StoredApplication, "status" | "reviewNote">>) {
  const all = readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const existing = all[idx];
  if (!existing) return;
  all[idx] = { ...existing, ...updates };
}
