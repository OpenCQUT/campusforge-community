"use client";

export interface ClaimedIssueTask {
  id: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  claimedAt: string;
  remoteAssigned: boolean;
}

const TASKS_KEY = "cf_claimed_issue_tasks";

function readTasks(): ClaimedIssueTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) as ClaimedIssueTask[] : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: ClaimedIssueTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getClaimedIssueTasks(): ClaimedIssueTask[] {
  return readTasks();
}

export function saveClaimedIssueTask(task: ClaimedIssueTask) {
  const tasks = readTasks();
  const next = [task, ...tasks.filter((item) => item.id !== task.id)];
  writeTasks(next);
}
