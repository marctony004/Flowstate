import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Music,
  Hash,
  CheckSquare,
  Lightbulb,
  Flag,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import supabase from "@/supabase";
import type { Project, Task, Idea, Milestone } from "@/types/database";
import ProjectDialog from "@/components/dashboard/ProjectDialog";
import TaskDialog from "@/components/dashboard/TaskDialog";
import DeleteDialog from "@/components/dashboard/DeleteDialog";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [projectRes, tasksRes, ideasRes, milestonesRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("ideas")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", id)
        .order("position", { ascending: true }),
    ]);
    setProject(projectRes.data);
    setTasks(tasksRes.data ?? []);
    setIdeas(ideasRes.data ?? []);
    setMilestones(milestonesRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeleteProject() {
    if (!project) return;
    setDeletingProject(true);
    await supabase.from("projects").delete().eq("id", project.id);
    setDeletingProject(false);
    navigate("/dashboard/projects");
  }

  async function handleDeleteTask() {
    if (!deleteTaskTarget) return;
    setDeletingTask(true);
    await supabase.from("tasks").delete().eq("id", deleteTaskTarget.id);
    setDeletingTask(false);
    setDeleteTaskOpen(false);
    setDeleteTaskTarget(null);
    fetchData();
  }

  async function toggleTaskComplete(task: Task) {
    await supabase
      .from("tasks")
      .update({
        completed_at: task.completed_at ? null : new Date().toISOString(),
        status: task.completed_at ? "todo" : "done",
      })
      .eq("id", task.id);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="mb-4 text-lg text-muted-foreground">
          Project not found
        </p>
        <Button variant="outline" asChild>
          <Link to="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.completed_at).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-1 text-muted-foreground">
                {project.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {project.genre && (
                <span className="flex items-center gap-1">
                  <Music className="h-4 w-4" /> {project.genre}
                </span>
              )}
              {project.bpm && (
                <span className="flex items-center gap-1">
                  <Hash className="h-4 w-4" /> {project.bpm} BPM
                </span>
              )}
              {project.key_signature && (
                <span>Key: {project.key_signature}</span>
              )}
              {project.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />{" "}
                  Due {new Date(project.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditProjectOpen(true)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={() => setDeleteProjectOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                project.status === "active"
                  ? "bg-[var(--success)] text-white"
                  : project.status === "completed"
                    ? "bg-muted-foreground text-white"
                    : "bg-primary text-primary-foreground"
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckSquare className="h-5 w-5" /> Tasks
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditTask(null);
                setTaskDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tasks yet
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50"
                >
                  <button
                    onClick={() => toggleTaskComplete(task)}
                    className={`h-5 w-5 shrink-0 rounded border-2 transition-colors ${
                      task.completed_at
                        ? "border-[var(--success)] bg-[var(--success)]"
                        : "border-border hover:border-primary"
                    }`}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.completed_at
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditTask(task);
                        setTaskDialogOpen(true);
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTaskTarget(task);
                        setDeleteTaskOpen(true);
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--success)]"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Milestones + Ideas */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Flag className="h-5 w-5" /> Milestones
            </h2>
            {milestones.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No milestones
              </p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="flex items-start gap-2">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${
                        m.completed_at ? "bg-[var(--success)]" : "bg-border"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          m.completed_at
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {m.title}
                      </p>
                      {m.due_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Lightbulb className="h-5 w-5" /> Ideas
            </h2>
            {ideas.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No ideas linked
              </p>
            ) : (
              <div className="space-y-2">
                {ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="rounded-lg p-2 text-sm text-foreground hover:bg-accent/50"
                  >
                    {idea.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={project}
        onSuccess={fetchData}
      />

      <DeleteDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
        onConfirm={handleDeleteProject}
        entityName="Project"
        loading={deletingProject}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editTask}
        projectId={id}
        onSuccess={fetchData}
      />

      <DeleteDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        onConfirm={handleDeleteTask}
        entityName="Task"
        loading={deletingTask}
      />
    </div>
  );
}
