"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  ExternalLinkIcon,
  FolderKanbanIcon,
  FolderPlusIcon,
  Loader2Icon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";

import type { Project, SandboxRecord } from "@/lib/projects/types";
import { useTabState } from "@/components/tabs/use-tab-state";
import { useSandboxStore } from "@/app/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? "Request failed.");
  }
  return body;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Projects({ className }: Props) {
  const setTabId = useTabState()[1];
  const setSandboxId = useSandboxStore((state) => state.setSandboxId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: projectsData,
    mutate: mutateProjects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);

  const {
    data: sandboxesData,
    mutate: mutateSandboxes,
    isLoading: sandboxesLoading,
    error: sandboxesError,
  } = useSWR<{ sandboxes: SandboxRecord[] }>("/api/sandboxes", fetcher);

  const jsonRequest = async (url: string, body: unknown, init: RequestInit = {}) => {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Request failed.");
    }
    return json;
  };

  const openDialog = () => {
    setEditing(null);
    setName("");
    setRepoUrl("");
    setError(null);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditing(project);
    setName(project.name);
    setRepoUrl(project.repoUrl ?? "");
    setError(null);
    setCreateDialogOpen(true);
  };

  const submitProject = async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await jsonRequest(`/api/projects/${editing.id}`, {
          name: name.trim(),
          repoUrl: repoUrl.trim() || null,
        });
      } else {
        await jsonRequest("/api/projects", {
          name: name.trim(),
          repoUrl: repoUrl.trim() || undefined,
        });
      }
      setCreateDialogOpen(false);
      await mutateProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the project.");
    } finally {
      setBusy(false);
    }
  };

  const deleteProject = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to delete the project.");
      }
      await mutateProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the project.");
    }
  };

  const openProject = async (project: Project) => {
    if (project.sandboxId) {
      setSandboxId(project.sandboxId);
      setTabId("chat");
      return;
    }
    if (!project.repoUrl) {
      setError("This project has no sandbox or repo yet.");
      return;
    }
    setOpeningId(project.id);
    setError(null);
    try {
      const body = await jsonRequest("/api/chat/import/repo", {
        repo: { url: project.repoUrl },
      });
      setSandboxId(body.sandboxId);
      setTabId("chat");
      await jsonRequest(`/api/projects/${project.id}`, { sandboxId: body.sandboxId });
      await mutateProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open the project.");
    } finally {
      setOpeningId(null);
    }
  };

  const openSandbox = (sandbox: SandboxRecord) => {
    setSandboxId(sandbox.id);
    setTabId("chat");
  };

  const stopSandbox = async (sandbox: SandboxRecord) => {
    setError(null);
    try {
      const res = await fetch(`/api/sandboxes/${sandbox.id}/stop`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to stop the sandbox.");
      }
      await mutateSandboxes();
      await mutateProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop the sandbox.");
    }
  };

  const projects = projectsData?.projects ?? [];
  const sandboxes = sandboxesData?.sandboxes ?? [];

  return (
    <div
      className={cn(
        "flex flex-col min-h-0 gap-4 bg-secondary/20 overflow-y-auto p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FolderKanbanIcon className="w-5 h-5" />
          Projects
        </h2>
        <Button size="sm" onClick={openDialog}>
          <FolderPlusIcon className="w-4 h-4" />
          New project
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {projectsError ? (
        <p className="text-sm text-muted-foreground">
          {projectsError instanceof Error ? projectsError.message : "Failed to load projects."}
        </p>
      ) : projectsLoading ? (
        <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet. Create a project to save a sandbox and repo for quick access.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-2 rounded-md border border-primary/18 bg-background p-3"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{project.name}</p>
                {project.repoUrl && (
                  <p className="text-xs text-muted-foreground truncate">
                    <ExternalLinkIcon className="inline w-3 h-3" />
                    {project.repoUrl}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={openingId === project.id}
                  onClick={() => openProject(project)}
                  title="Open project"
                >
                  {openingId === project.id ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                  Open
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProject(project)}
                  title="Delete project"
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">Sandboxes</h2>
      </div>

      {sandboxesError ? (
        <p className="text-sm text-muted-foreground">
          {sandboxesError instanceof Error ? sandboxesError.message : "Failed to load sandboxes."}
        </p>
      ) : sandboxesLoading ? (
        <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : sandboxes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sandboxes yet. Sandboxes created from chat or imports are tracked here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sandboxes.map((sandbox) => (
            <li
              key={sandbox.id}
              className="flex items-center justify-between gap-2 rounded-md border border-primary/18 bg-background p-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs truncate">{sandbox.id}</p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(sandbox.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={sandbox.status === "stopped" ? "secondary" : "default"}
                  className="uppercase"
                >
                  {sandbox.status}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => openSandbox(sandbox)}>
                  Open
                </Button>
                {sandbox.status !== "stopped" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => stopSandbox(sandbox)}
                    title="Stop sandbox"
                  >
                    <SquareIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the project name and repo URL."
                : "Create a project from a repo URL, then open it to spin up a sandbox."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Repo URL (optional)"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={submitProject}>
              {busy && <Loader2Icon className="w-4 h-4 animate-spin" />}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}