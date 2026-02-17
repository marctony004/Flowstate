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
  Users,
  UserPlus,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Project, Task, Idea, Milestone, ProjectMember, Profile } from "@/types/database";
import ProjectDialog from "@/components/dashboard/ProjectDialog";
import TaskDialog from "@/components/dashboard/TaskDialog";
import MilestoneDialog from "@/components/dashboard/MilestoneDialog";
import InviteMemberDialog from "@/components/dashboard/InviteMemberDialog";
import DeleteDialog from "@/components/dashboard/DeleteDialog";
import ProjectStateBadge from "@/components/dashboard/ProjectStateBadge";
import StuckInterventionDialog from "@/components/dashboard/StuckInterventionDialog";
import { toast } from "sonner";

interface MemberWithProfile extends ProjectMember {
  profile?: Pick<Profile, "display_name" | "avatar_url" | "role"> | null;
}

export default function ProjectDetailPage() {
  const { session } = useSession();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [deleteMilestoneOpen, setDeleteMilestoneOpen] = useState(false);
  const [deleteMilestoneTarget, setDeleteMilestoneTarget] = useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState(false);

  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [stuckDialogOpen, setStuckDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const [projectRes, tasksRes, ideasRes, milestonesRes, membersRes] =
        await Promise.all([
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
          supabase
            .from("project_members")
            .select("*")
            .eq("project_id", id)
            .order("invited_at", { ascending: true }),
        ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data ?? []);
      setIdeas(ideasRes.data ?? []);
      setMilestones(milestonesRes.data ?? []);

      // Enrich members with profile data
      const rawMembers = membersRes.data ?? [];
      if (rawMembers.length > 0) {
        const userIds = rawMembers.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, role")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]));
        setMembers(
          rawMembers.map((m) => ({
            ...m,
            profile: profileMap.get(m.user_id) ?? null,
          }))
        );
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("Failed to load project data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-detect project state on first load if not yet analyzed
  useEffect(() => {
    if (project && !project.ai_state && session?.user.id && id) {
      supabase.functions
        .invoke("detect-project-state", {
          body: { projectId: id, userId: session.user.id },
        })
        .then(() => fetchData())
        .catch(() => {}); // non-critical
    }
  }, [project?.id, project?.ai_state, session?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteProject() {
    if (!project) return;
    setDeletingProject(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    setDeletingProject(false);
    if (error) {
      toast.error("Failed to delete project");
      return;
    }
    toast.success("Project deleted");
    navigate("/dashboard/projects");
  }

  async function handleDeleteTask() {
    if (!deleteTaskTarget) return;
    setDeletingTask(true);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", deleteTaskTarget.id);
    setDeletingTask(false);
    setDeleteTaskOpen(false);
    setDeleteTaskTarget(null);
    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    toast.success("Task deleted");
    fetchData();
  }

  async function handleDeleteMilestone() {
    if (!deleteMilestoneTarget) return;
    setDeletingMilestone(true);
    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", deleteMilestoneTarget.id);
    setDeletingMilestone(false);
    setDeleteMilestoneOpen(false);
    setDeleteMilestoneTarget(null);
    if (error) {
      toast.error("Failed to delete milestone");
      return;
    }
    toast.success("Milestone deleted");
    fetchData();
  }

  async function toggleMilestoneComplete(m: Milestone) {
    await supabase
      .from("milestones")
      .update({
        completed_at: m.completed_at ? null : new Date().toISOString(),
      })
      .eq("id", m.id);
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

  async function removeMember(memberId: string) {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId);
    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    toast.success("Member removed");
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
              className="border-[var(--warning)]/50 text-[var(--warning)] hover:bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]"
              onClick={() => setStuckDialogOpen(true)}
            >
              <HelpCircle className="mr-1 h-4 w-4" />
              I'm Stuck
            </Button>
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
            <ProjectStateBadge
              projectId={project.id}
              projectTitle={project.title}
              aiState={project.ai_state as { state: "evolving" | "stuck" | "ready-to-ship" | "on-hold" | "conceptually-complete"; confidence: number; explanation: string; signals?: string[]; detectedAt: string; overriddenBy?: string } | null}
              onStateUpdated={fetchData}
            />
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

        {/* Sidebar: Milestones + Team + Ideas */}
        <div className="space-y-6">
          {/* Milestones */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Flag className="h-5 w-5" /> Milestones
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditMilestone(null);
                  setMilestoneDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {milestones.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No milestones
              </p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="group flex items-start gap-2">
                    <button
                      onClick={() => toggleMilestoneComplete(m)}
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full transition-colors ${
                        m.completed_at
                          ? "bg-[var(--success)]"
                          : "bg-border hover:bg-primary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
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
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditMilestone(m);
                          setMilestoneDialogOpen(true);
                        }}
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteMilestoneTarget(m);
                          setDeleteMilestoneOpen(true);
                        }}
                        className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Users className="h-5 w-5" /> Team
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInviteMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            {members.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No team members
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center gap-2 rounded-lg p-2 hover:bg-accent/50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {m.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.profile?.display_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.role}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ideas */}
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

      {/* Dialogs */}
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

      <MilestoneDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        milestone={editMilestone}
        projectId={id!}
        onSuccess={fetchData}
      />

      <DeleteDialog
        open={deleteMilestoneOpen}
        onOpenChange={setDeleteMilestoneOpen}
        onConfirm={handleDeleteMilestone}
        entityName="Milestone"
        loading={deletingMilestone}
      />

      <InviteMemberDialog
        open={inviteMemberOpen}
        onOpenChange={setInviteMemberOpen}
        projectId={id!}
        onSuccess={fetchData}
      />

      <StuckInterventionDialog
        open={stuckDialogOpen}
        onOpenChange={setStuckDialogOpen}
        projectId={id!}
        projectTitle={project.title}
        onTaskCreated={fetchData}
      />
    </div>
  );
}
