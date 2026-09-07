import { ToggleWelcome } from "@/components/modals/welcome";
import { VercelDashed } from "@/components/icons/vercel-dashed";
import { cn } from "@/lib/utils";
import { useTabState } from "@/components/tabs/use-tab-state";
import { SurfaceTab } from "@/components/tabs/use-tab-state";
import { Button } from "@/components/ui/button";
import { GitBranch, Rocket, Menu } from "lucide-react";

const SURFACE_TABS: { id: SurfaceTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "settings", label: "Settings" },
  { id: "logs", label: "Logs" },
  { id: "code", label: "Code" },
  { id: "terminal", label: "Terminal" },
];

interface Props {
  className?: string;
}

export function Header({ className }: Props) {
  const [activeTab, setTab] = useTabState();

  return (
    <header className={cn("flex items-center justify-between px-3 h-11 border-b border-border bg-background shrink-0", className)}>
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1 rounded hover:bg-accent">
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <VercelDashed className="ml-0.5 mr-1" />
          <span className="text-sm font-bold tracking-tight">OSS Vibe Coding Platform</span>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-4">
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            my-project
          </span>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> main
          </span>
        </div>
      </div>

      <nav className="flex items-center gap-0.5">
        {SURFACE_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              activeTab === id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <ToggleWelcome />
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Rocket className="w-3 h-3" />
          <span className="hidden sm:inline">Publish</span>
        </Button>
      </div>
    </header>
  );
}
