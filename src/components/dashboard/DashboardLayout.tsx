import { useState, useEffect, useCallback } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { cn } from "@/lib/utils";
import SearchDialog, { useSearchShortcut } from "./SearchDialog";
import AskFlowState from "./AskFlowState";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Ideas", href: "/dashboard/ideas", icon: Lightbulb },
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

export default function DashboardLayout() {
  const { session, profile, isAdmin } = useSession();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [buttonBursting, setButtonBursting] = useState(false);

  // Handle AI button click with burst animation
  const handleAIButtonClick = () => {
    setButtonBursting(true);
    // Delay opening the panel to let burst animation play
    setTimeout(() => {
      setAskAIOpen(true);
      // Reset burst state after panel opens
      setTimeout(() => setButtonBursting(false), 100);
    }, 200);
  };

  // Register Cmd+K shortcut
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useSearchShortcut(openSearch);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              FlowState
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Admin-only nav items */}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-border" />
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {profile?.display_name?.charAt(0).toUpperCase() || (session?.user.email?.charAt(0).toUpperCase() ?? "?")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.display_name || session?.user.user_metadata?.full_name || session?.user.email}
                </p>
                {isAdmin && (
                  <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                    <Shield className="h-2.5 w-2.5" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-heading text-lg font-bold text-foreground lg:hidden">
              FlowState
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search Button */}
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

      {/* Floating AI Assistant Button - Music Equalizer Style */}
      {!askAIOpen && (
        <button
          onClick={handleAIButtonClick}
          className={cn(
            "group fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110",
            buttonBursting && "animate-[buttonBurst_0.3s_ease-out_forwards]"
          )}
        >
          {/* Burst rings that expand outward when clicked */}
          {buttonBursting && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-[burstRing_0.4s_ease-out_forwards]" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent animate-[burstRing_0.4s_ease-out_forwards]" style={{ animationDelay: '0.1s' }} />
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary animate-[burstRing_0.4s_ease-out_forwards]" style={{ animationDelay: '0.15s' }} />
            </>
          )}

          {/* Glow ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* Main button */}
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            {/* Animated equalizer bars */}
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
