import { useState, useEffect, useCallback } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Disc3,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Command,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { cn } from "@/lib/utils";
import SearchDialog, { useSearchShortcut } from "./SearchDialog";
import AskFlowState from "./AskFlowState";

const navItems = [
  { label: "Session Hub", href: "/dashboard", icon: Disc3 },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Ideas", href: "/dashboard/ideas", icon: Mic },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Collaborators", href: "/dashboard/collaborators", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavItems = [
  { label: "User Management", href: "/dashboard/admin/users", icon: Shield },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

function useSidebarPinned() {
  const [pinned, setPinned] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-pinned") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-pinned", String(pinned));
  }, [pinned]);

  return [pinned, () => setPinned((p) => !p)] as const;
}

export default function DashboardLayout() {
  const { session, profile, isAdmin } = useSession();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, togglePinned] = useSidebarPinned();
  const [dark, toggleDark] = useDarkMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [buttonBursting, setButtonBursting] = useState(false);

  const expanded = pinned || hovered;

  const handleAIButtonClick = () => {
    setButtonBursting(true);
    setTimeout(() => {
      setAskAIOpen(true);
      setTimeout(() => setButtonBursting(false), 100);
    }, 200);
  };

  const openSearch = useCallback(() => setSearchOpen(true), []);
  useSearchShortcut(openSearch);

  const userInitial =
    profile?.display_name?.charAt(0).toUpperCase() ||
    session?.user.email?.charAt(0).toUpperCase() ||
    "?";

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — studio tool dock */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/40 bg-card/90 backdrop-blur-md",
          "transition-[width] duration-[250ms] ease-out motion-reduce:transition-none",
          "lg:static",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          "lg:translate-x-0",
          expanded ? "lg:w-[13rem]" : "lg:w-14"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/40",
          expanded ? "px-3 justify-between" : "justify-center"
        )}>
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-primary-foreground">F</span>
            </div>
            {expanded && (
              <span className="font-heading text-sm font-semibold text-foreground whitespace-nowrap">
                FlowState
              </span>
            )}
          </Link>
          {/* Mobile close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          {/* Desktop pin toggle */}
          {expanded && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground"
              onClick={togglePinned}
              aria-label={pinned ? "Collapse sidebar" : "Pin sidebar"}
            >
              {pinned ? <ChevronsLeft className="h-3.5 w-3.5" /> : <ChevronsRight className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 py-3 px-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                title={!expanded ? item.label : undefined}
                className={cn(
                  "group relative flex items-center h-9 rounded-md text-[13px] font-medium",
                  "transition-colors duration-150 motion-reduce:transition-none",
                  expanded
                    ? "gap-2.5 pl-[11px] pr-2"
                    : "justify-center",
                  isActive
                    ? cn("text-primary", expanded && "bg-primary/5")
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {expanded && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
                {!expanded && (
                  <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md lg:group-hover:block whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin-only nav items */}
          {isAdmin && (
            <>
              <div className="!mt-3 border-t border-border/30 mx-1" />
              {expanded && (
                <p className="pl-[11px] py-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  Admin
                </p>
              )}
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={!expanded ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center h-9 rounded-md text-[13px] font-medium",
                      "transition-colors duration-150 motion-reduce:transition-none",
                      expanded
                        ? "gap-2.5 pl-[11px] pr-2"
                        : "justify-center",
                      isActive
                        ? cn("text-primary/80", expanded && "bg-primary/5")
                        : "text-muted-foreground/65 hover:text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary/70" />
                    )}
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {expanded && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                    {!expanded && (
                      <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md lg:group-hover:block whitespace-nowrap z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className={cn(
          "shrink-0 border-t border-border/40",
          expanded ? "p-2.5" : "py-3 flex justify-center"
        )}>
          {expanded ? (
            <>
              <div className="mb-1.5 flex items-center gap-2.5 pl-[3px]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {profile?.display_name || session?.user.user_metadata?.full_name || session?.user.email}
                    </p>
                    {isAdmin && (
                      <Badge variant="secondary" className="gap-0.5 text-[8px] px-1 py-0">
                        <Shield className="h-2 w-2" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground/70">
                    {session?.user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground/70 hover:text-muted-foreground h-7 text-[11px]"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </Button>
            </>
          ) : (
            <button
              onClick={() => supabase.auth.signOut()}
              title="Sign Out"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {userInitial}
              <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md lg:group-hover:block whitespace-nowrap z-50">
                Sign Out
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-heading text-lg font-bold text-foreground lg:hidden">
              FlowState
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDark}
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Ask AI Dialog */}
      <AskFlowState open={askAIOpen} onOpenChange={setAskAIOpen} />

      {/* Floating AI Assistant Button */}
      {!askAIOpen && (
        <button
          onClick={handleAIButtonClick}
          className={cn(
            "group fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110",
            buttonBursting && "animate-[buttonBurst_0.3s_ease-out_forwards]"
          )}
        >
          {buttonBursting && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-[burstRing_0.4s_ease-out_forwards]" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-[burstRing_0.4s_ease-out_forwards]" style={{ animationDelay: '0.1s' }} />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary animate-[burstRing_0.4s_ease-out_forwards]" style={{ animationDelay: '0.15s' }} />
            </>
          )}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <span className="flex items-end gap-[3px] h-6">
              <span className="w-[3px] bg-primary-foreground rounded-full animate-[equalize_2.8s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0s' }} />
              <span className="w-[3px] bg-primary-foreground rounded-full animate-[equalize_2.2s_ease-in-out_infinite]" style={{ height: '70%', animationDelay: '0.5s' }} />
              <span className="w-[3px] bg-primary-foreground rounded-full animate-[equalize_2.5s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0.3s' }} />
              <span className="w-[3px] bg-primary-foreground rounded-full animate-[equalize_2s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0.8s' }} />
              <span className="w-[3px] bg-primary-foreground rounded-full animate-[equalize_3s_ease-in-out_infinite]" style={{ height: '30%', animationDelay: '0.4s' }} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
