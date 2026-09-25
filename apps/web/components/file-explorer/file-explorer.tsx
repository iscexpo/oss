"use client";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FileIcon,
  Code2Icon,
  Loader2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileContent } from "@/components/file-explorer/file-content";
import { Panel, PanelHeader } from "@/components/panels/panels";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { buildFileTree, type FileNode } from "./build-file-tree";
import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  className: string;
  disabled?: boolean;
  paths: string[];
  sandboxId?: string;
}

export const FileExplorer = memo(function FileExplorer({
  className,
  disabled,
  paths,
  sandboxId,
}: Props) {
  const fileTree = useMemo(() => buildFileTree(paths), [paths]);
  const [selected, setSelected] = useState<FileNode | null>(null);
  const [fs, setFs] = useState<FileNode[]>(fileTree);
  const [view, setView] = useState<"files" | "vscode">("files");
  const [vscodeUrl, setVscodeUrl] = useState<string | null>(null);
  const [vscodeLoading, setVscodeLoading] = useState(false);

  useEffect(() => {
    setFs(fileTree);
  }, [fileTree]);

  const openVSCode = useCallback(async () => {
    if (!sandboxId || disabled || vscodeLoading) return;
    setVscodeLoading(true);
    try {
      const res = await fetch(`/api/sandboxes/${sandboxId}/vscode`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to open VS Code.");
      }
      setVscodeUrl(data.url);
      setView("vscode");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open VS Code.");
    } finally {
      setVscodeLoading(false);
    }
  }, [sandboxId, disabled, vscodeLoading]);

  const toggleFolder = useCallback((path: string) => {
    setFs((prev) => {
      const updateNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map((node) => {
          if (node.path === path && node.type === "folder") {
            return { ...node, expanded: !node.expanded };
          } else if (node.children) {
            return { ...node, children: updateNode(node.children) };
          } else {
            return node;
          }
        });
      return updateNode(prev);
    });
  }, []);

  const selectFile = useCallback((node: FileNode) => {
    if (node.type === "file") {
      setSelected(node);
    }
  }, []);

  const renderFileTree = useCallback(
    (nodes: FileNode[], depth = 0) => {
      return nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={depth}
          selected={selected}
          onToggleFolder={toggleFolder}
          onSelectFile={selectFile}
          renderFileTree={renderFileTree}
        />
      ));
    },
    [selected, toggleFolder, selectFile],
  );

  const switchView = useCallback(
    (next: "files" | "vscode") => {
      if (next === "vscode" && !vscodeUrl) {
        openVSCode();
        return;
      }
      setView(next);
    },
    [vscodeUrl, openVSCode],
  );

  return (
    <Panel className={className}>
      <PanelHeader>
        <FileIcon className="w-4 mr-2" />
        <span className="font-mono uppercase font-semibold">Sandbox Remote Filesystem</span>
        <span className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant={view === "vscode" ? "default" : "outline"}
            disabled={disabled || !sandboxId || vscodeLoading}
            onClick={() => switchView("vscode")}
            title="Open the sandbox file system in VS Code (code-server)"
          >
            {vscodeLoading ? (
              <Loader2Icon className="w-3.5 animate-spin" />
            ) : (
              <Code2Icon className="w-3.5" />
            )}
            <span className="hidden sm:inline">
              {vscodeLoading ? "Starting…" : "VS Code"}
            </span>
          </Button>
          <Button
            size="sm"
            variant={view === "files" ? "default" : "outline"}
            onClick={() => switchView("files")}
            title="Browse sandbox files"
          >
            <FolderIcon className="w-3.5" />
            <span className="hidden sm:inline">Files</span>
          </Button>
          {vscodeUrl && (
            <a
              href={vscodeUrl}
              target="_blank"
              rel="noreferrer"
              title="Open VS Code in a new tab"
            >
              <Button size="sm" variant="ghost" className="h-7 w-7 px-0">
                <ExternalLinkIcon className="w-3.5" />
              </Button>
            </a>
          )}
        </span>
      </PanelHeader>

      {view === "vscode" && vscodeUrl ? (
        <iframe
          src={vscodeUrl}
          title="VS Code in the browser"
          className="w-full h-[calc(100%-2rem-1px)]"
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="flex text-sm h-[calc(100%-2rem-1px)]">
          <ScrollArea className="w-1/4 border-r border-primary/18 flex-shrink-0">
            <div>{renderFileTree(fs)}</div>
          </ScrollArea>
          {selected && sandboxId && !disabled && (
            <ScrollArea className="w-3/4 flex-shrink-0">
              <FileContent sandboxId={sandboxId} path={selected.path.substring(1)} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      )}
    </Panel>
  );
});

// Memoized file tree node component
const FileTreeNode = memo(function FileTreeNode({
  node,
  depth,
  selected,
  onToggleFolder,
  onSelectFile,
  renderFileTree,
}: {
  node: FileNode;
  depth: number;
  selected: FileNode | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (node: FileNode) => void;
  renderFileTree: (nodes: FileNode[], depth: number) => React.ReactNode;
}) {
  const handleClick = useCallback(() => {
    if (node.type === "folder") {
      onToggleFolder(node.path);
    } else {
      onSelectFile(node);
    }
  }, [node, onToggleFolder, onSelectFile]);

  return (
    <div>
      <div
        className={cn(`flex items-center py-0.5 px-1 hover:bg-gray-100 cursor-pointer`, {
          "bg-gray-200/80": selected?.path === node.path,
        })}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            {node.expanded ? (
              <ChevronDownIcon className="w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="w-4 mr-1" />
            )}
            <FolderIcon className="w-4 mr-2" />
          </>
        ) : (
          <>
            <div className="w-4 mr-1" />
            <FileIcon className="w-4 mr-2 " />
          </>
        )}
        <span className="">{node.name}</span>
      </div>

      {node.type === "folder" && node.expanded && node.children && (
        <div>{renderFileTree(node.children, depth + 1)}</div>
      )}
    </div>
  );
});