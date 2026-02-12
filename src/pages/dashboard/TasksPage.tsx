import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Plus, Search, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Task } from "@/types/database";
import TaskDialog from "@/components/dashboard/TaskDialog";
import DeleteDialog from "@/components/dashboard/DeleteDialog";
import { toast } from "sonner";
import { parseTaskWithAI } from "@/lib/nlpTaskService";
import { logActivity } from "@/lib/activityLogger";

const columns = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-[var(--warning)]",
  low: "bg-[var(--success)]",
};

export default function TasksPage() {
  const { session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState("");
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  // Fetch projects for NL task matching
  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from("projects")
      .select("id, title")
      .eq("owner_id", session.user.id)
      .order("title")
      .then(({ data }) => setProjects(data ?? []));
  }, [session?.user.id]);

  const fetchTasks = useCallback(async () => {
    if (!session?.user.id) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("created_by", session.user.id)
        .order("position", { ascending: true });
      setTasks(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (error) { toast.error("Failed to delete task"); return; }
    toast.success("Task deleted");
    fetchTasks();
  }

  // Quick add task with natural language
  async function handleQuickAdd(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !quickAddInput.trim() || !session?.user.id) return;

    // Try AI parsing first, fall back to local
    const parsed = await parseTaskWithAI(quickAddInput, projects);
    if (!parsed.title) return;

    // Use AI-matched project, or try to match project hint, or use only project
    let projectId: string | null = parsed.projectMatchId || null;
    if (!projectId && parsed.projectHint) {
      const matchedProject = projects.find(p =>
        p.title.toLowerCase().includes(parsed.projectHint!.toLowerCase())
      );
      if (matchedProject) projectId = matchedProject.id;
    }

    // Use first project if no match and only one project exists
    if (!projectId && projects.length === 1) {
      projectId = projects[0].id;
    }

    if (!projectId) {
      toast.error("Couldn't match a project. Try including a project name or use the form.");
      return;
    }

    const payload = {
      title: parsed.title,
      description: null,
      status: "todo",
      priority: parsed.priority || "medium",
      due_date: parsed.dueDate || null,
      project_id: projectId,
      created_by: session.user.id,
    };

    const { data: newTask, error } = await supabase.from("tasks").insert(payload).select("id").single();
    if (error) {
      toast.error("Failed to create task");
      return;
    }

    const aiLabel = parsed.usedAI ? " ✨" : "";
    toast.success(`Task created${aiLabel}: "${parsed.title}"${parsed.dueDate ? ` (due ${parsed.dueDateText})` : ""}`);
    logActivity({
      userId: session.user.id,
      action: "create",
      entityType: "task",
      entityId: newTask?.id,
      projectId,
      metadata: { title: parsed.title, nlParsed: true },
    });

    setQuickAddInput("");
    fetchTasks();
  }

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Track your work across all projects
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTask(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Quick Add with Natural Language */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Quick add with natural language</span>
        </div>
        <input
          type="text"
          placeholder='Try: "Finish mix by Friday" or "Record vocals for Track 3 tomorrow"'
          value={quickAddInput}
          onChange={(e) => setQuickAddInput(e.target.value)}
          onKeyDown={handleQuickAdd}
          className="h-10 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to create. Dates like "tomorrow", "next week", "by Friday" are automatically parsed.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Kanban Board */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <CheckSquare className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-foreground">
            No tasks yet
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create tasks to track your progress across projects.
          </p>
          <Button
            onClick={() => {
              setEditTask(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {col.label}
                  </h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditTask(task);
                              setDialogOpen(true);
                            }}
                            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(task);
                              setDeleteOpen(true);
                            }}
                            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${priorityColors[task.priority] ?? "bg-muted"}`}
                          />
                        </div>
                      </div>
                      {task.description && (
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editTask}
        onSuccess={fetchTasks}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        entityName="Task"
        loading={deleting}
      />
    </div>
  );
}
