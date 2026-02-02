import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Lightbulb,
  CheckSquare,
  Users,
  Plus,
  ArrowRight,
  Clock,
  FileText,
  Mic,
  Image,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Project, Idea, Task, ActivityLog } from "@/types/database";

const typeIcons: Record<string, typeof FileText> = {
  text: FileText,
  voice: Mic,
  image: Image,
  video: Film,
};

function formatActivity(item: ActivityLog): string {
  const action = item.action.toLowerCase();
  const entity = item.entity_type.toLowerCase();
  const meta = item.metadata as Record<string, unknown> | null;
  const name = meta?.title ?? meta?.name;

  const verb =
    action === "create"
      ? "Created"
      : action === "update"
        ? "Updated"
        : action === "delete"
          ? "Deleted"
          : item.action.charAt(0).toUpperCase() + item.action.slice(1);

  const label = name ? `${entity} '${name}'` : entity;
  return `${verb} ${label}`;
}

export default function DashboardHomePage() {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      const [projectsRes, ideasRes, tasksRes, activityRes, collabRes] =
        await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .eq("owner_id", userId!)
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("ideas")
            .select("*")
            .eq("owner_id", userId!)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("tasks")
            .select("*")
            .eq("created_by", userId!)
            .is("completed_at", null)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("activity_log")
            .select("*")
            .eq("user_id", userId!)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("collaborator_notes")
            .select("id", { count: "exact", head: true })
            .eq("collaborator_id", userId!),
        ]);

      setProjects(projectsRes.data ?? []);
      setIdeas(ideasRes.data ?? []);
      setTasks(tasksRes.data ?? []);
      setActivity(activityRes.data ?? []);
      setCollaboratorCount(collabRes.count ?? 0);
      setLoading(false);
    }

    fetchData();
  }, [userId]);

  const firstName =
    session?.user.user_metadata?.full_name?.split(" ")[0] ??
    session?.user.email?.split("@")[0] ??
    "there";

  const stats = [
    {
      label: "Active Projects",
      value: projects.filter((p) => p.status === "active").length,
      icon: FolderKanban,
      href: "/dashboard/projects",
      color: "text-primary",
    },
    {
      label: "Ideas Captured",
      value: ideas.length,
      icon: Lightbulb,
      href: "/dashboard/ideas",
      color: "text-[var(--warning)]",
    },
    {
      label: "Open Tasks",
      value: tasks.length,
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "text-[var(--success)]",
    },
    {
      label: "Collaborators",
      value: collaboratorCount,
      icon: Users,
      href: "/dashboard/collaborators",
      color: "text-[var(--accent)]",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your projects.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/projects">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Projects
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/projects">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet. Create your first project to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {project.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.genre && `${project.genre} · `}
                      {project.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ideas */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Ideas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/ideas">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {ideas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No ideas yet. Capture your first idea to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => {
                const IdeaIcon = typeIcons[idea.type] ?? FileText;
                return (
                  <div
                    key={idea.id}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--warning)]/10">
                      <IdeaIcon className="h-5 w-5 text-[var(--warning)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {idea.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {idea.type} ·{" "}
                        {new Date(idea.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity yet. Start creating to see your activity here.
          </p>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg p-3"
              >
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    {formatActivity(item)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Tasks */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Open Tasks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/tasks">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No open tasks. You're all caught up!
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--success)]"
                  }`}
                />
                <p className="flex-1 truncate text-sm text-foreground">
                  {task.title}
                </p>
                {task.due_date && (
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
