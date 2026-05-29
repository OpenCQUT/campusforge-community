"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteClaimedIssueTask, saveClaimedIssueTask } from "@/lib/issue-task-store";
import type { GitHubConnection } from "@/lib/github-connection-store";

interface IssueItem {
  id: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  comments: number;
  updatedAt: string;
  labels: { name: string; color: string }[];
  assignees: string[];
  claimedBy: string | null;
  claimedAt: string | null;
  remoteAssigned: boolean;
  author: string;
}

function getSessionRole(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/cf_role=(\w+)/);
  return match?.[1] ?? "";
}

export default function IssuesPage() {
  const t = useTranslations("issues");
  const [items, setItems] = useState<IssueItem[]>([]);
  const [org, setOrg] = useState("OpenCQUT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(() => new Set());
  const [githubConnection, setGitHubConnection] = useState<GitHubConnection | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadIssues() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/github/issues");
        if (!response.ok) throw new Error("failed");
        const data = await response.json() as { org: string; items: IssueItem[] };
        if (!active) return;
        setOrg(data.org);
        setItems(data.items);
      } catch {
        if (active) setError(t("loadFailed"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadIssues();
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    async function loadConnection() {
      try {
        const response = await fetch("/api/github/connection");
        if (!response.ok) return;
        const data = await response.json() as { connection: GitHubConnection | null };
        setGitHubConnection(data.connection);
      } catch {
        setGitHubConnection(null);
      }
    }

    loadConnection();
  }, []);

  async function claimIssue(issue: IssueItem) {
    if (!githubConnection) {
      setNotice(t("connectGitHubFirst"));
      return;
    }

    setClaiming(issue.id);
    setNotice("");
    try {
      const response = await fetch("/api/github/issues/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: issue.owner,
          repo: issue.repo,
          number: issue.number,
          title: issue.title,
          url: issue.url,
          assignee: githubConnection.username,
        }),
      });
      const data = await response.json() as {
        remoteAssigned?: boolean;
        claimedBy?: string;
        claimedAt?: string;
        alreadyClaimed?: boolean;
        reason?: string;
      };
      if (!response.ok && !data.alreadyClaimed) throw new Error(data.reason ?? "failed");

      saveClaimedIssueTask({
        id: issue.id,
        owner: issue.owner,
        repo: issue.repo,
        number: issue.number,
        title: issue.title,
        url: issue.url,
        claimedAt: data.claimedAt ?? new Date().toISOString(),
        remoteAssigned: data.remoteAssigned === true,
      });
      setClaimedIds((prev) => new Set(prev).add(issue.id));
      setItems((prev) => prev.map((item) => item.id === issue.id
        ? {
            ...item,
            claimedBy: data.claimedBy ?? githubConnection.username,
            claimedAt: data.claimedAt ?? new Date().toISOString(),
            remoteAssigned: data.remoteAssigned === true,
          }
        : item));
      setNotice(data.alreadyClaimed ? t("alreadyClaimed") : data.remoteAssigned ? t("claimSuccess") : t("claimLocalOnly"));
    } catch {
      setNotice(t("claimFailed"));
    } finally {
      setClaiming(null);
    }
  }

  async function cancelClaim(issue: IssueItem) {
    setCancelling(issue.id);
    setNotice("");
    try {
      const response = await fetch("/api/github/issues/claim", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: issue.owner,
          repo: issue.repo,
          number: issue.number,
          assignee: githubConnection?.username,
        }),
      });
      if (!response.ok) throw new Error("failed");
      deleteClaimedIssueTask(issue.id);
      setClaimedIds((prev) => {
        const next = new Set(prev);
        next.delete(issue.id);
        return next;
      });
      setItems((prev) => prev.map((item) => item.id === issue.id
        ? {
            ...item,
            claimedBy: null,
            claimedAt: null,
            remoteAssigned: item.assignees.length > 0,
          }
        : item));
      setNotice(t("cancelSuccess"));
    } catch {
      setNotice(t("cancelFailed"));
    } finally {
      setCancelling(null);
    }
  }

  return (
    <main className="page page-fixed">
      <div className="page-header">
        <h1 className="page-title">{t("title", { org })}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      {notice && <div className="inline-notice">{notice}</div>}

      <div className="page-scroll-panel issue-board">
        {loading ? (
          <div className="glass-card empty-card">{t("loading")}</div>
        ) : error ? (
          <div className="glass-card empty-card">{error}</div>
        ) : items.length === 0 ? (
          <div className="glass-card empty-card">{t("empty")}</div>
        ) : (
          items.map((issue) => {
            const isClaimed = claimedIds.has(issue.id);
            const isServerClaimed = Boolean(issue.claimedBy);
            const hasRemoteAssignee = issue.assignees.length > 0;
            const hasAssignee = hasRemoteAssignee || isServerClaimed;
            const canCancelClaim = isServerClaimed && (getSessionRole() === "admin" || issue.claimedBy === githubConnection?.username);
            return (
              <article key={issue.id} className="glass-card issue-card">
                <div className="issue-card-main">
                  <div className="issue-meta">
                    <span>{issue.owner}/{issue.repo}</span>
                    <span>#{issue.number}</span>
                    <span>{t("comments", { count: issue.comments })}</span>
                  </div>
                  <h2>
                    <a href={issue.url} target="_blank" rel="noreferrer">{issue.title}</a>
                  </h2>
                  <div className="issue-labels">
                    {issue.labels.length === 0 ? (
                      <span className="tag tag-muted">{t("noLabels")}</span>
                    ) : issue.labels.slice(0, 6).map((label) => (
                      <span key={`${issue.id}-${label.name}`} className="tag tag-muted">
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="issue-card-side">
                  <span className={`tag ${hasAssignee ? "tag-blue" : "tag-success"}`}>
                    {hasRemoteAssignee ? t("assigned") : isServerClaimed ? t("claimedStatus") : t("unassigned")}
                  </span>
                  {canCancelClaim ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => cancelClaim(issue)}
                      disabled={cancelling === issue.id}
                    >
                      {cancelling === issue.id ? t("cancelling") : t("cancelClaim")}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => claimIssue(issue)}
                      disabled={claiming === issue.id || isClaimed || isServerClaimed}
                    >
                      {isClaimed || isServerClaimed ? t("claimed") : claiming === issue.id ? t("claiming") : t("claim")}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
