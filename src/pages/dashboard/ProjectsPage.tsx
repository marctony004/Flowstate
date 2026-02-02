import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  FolderKanban,
  Calendar,
  Music,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Project } from "@/types/database";
import ProjectDialog from "@/components/dashboard/ProjectDialog";
import DeleteDialog from "@/components/dashboard/DeleteDialog";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-[var(--success)] text-white",
  planning: "bg-primary text-primary-foreground",
  completed: "bg-muted-foreground text-white",
  on_hold: "bg-[var(--warning)] text-white",
};

export default function ProjectsPage() {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("updated_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (error) { toast.error("Failed to delete project"); return; }
    toast.success("Project deleted");
    fetchProjects();
  }

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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your creative projects
          </p>
        </div>
        <Button
          onClick={() => {
            setEditProject(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "planning", "completed", "on_hold"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all"
                ? "All"
                : s === "on_hold"
                  ? "On Hold"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-foreground">
            {search ? "No matching projects" : "No projects yet"}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search or filters."
              : "Create your first project to start organizing your creative work."}
          </p>
          {!search && (
            <Button
              onClick={() => {
                setEditProject(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
            >
              {/* Edit / Delete buttons */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setEditProject(project);
                    setDialogOpen(true);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget(project);
                    setDeleteOpen(true);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <Link to={`/dashboard/projects/${project.id}`}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                    {project.title.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {project.status}
                  </span>
                </div>
                <h3 className="mb-1 text-base font-semibold text-foreground group-hover:text-primary">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {project.genre && (
                    <span className="flex items-center gap-1">
                      <Music className="h-3.5 w-3.5" />
                      {project.genre}
                    </span>
                  )}
                  {project.bpm && <span>{project.bpm} BPM</span>}
                  {project.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editProject}
        onSuccess={fetchProjects}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        entityName="Project"
        loading={deleting}
      />
    </div>
  );
}
