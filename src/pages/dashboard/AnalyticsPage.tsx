import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Lightbulb,
  CheckSquare,
  FolderKanban,
  Users,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Project, Task, Idea, ActivityLog } from "@/types/database";

const COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "#ef4444",
  "#8b5cf6",
];

export default function AnalyticsPage() {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id;

  useEffect(() => {
    async function fetchData() {
      if (!userId) { setLoading(false); return; }
      try {
        const [projRes, taskRes, ideaRes, actRes] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("tasks")
            .select("*")
            .eq("created_by", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("ideas")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("activity_log")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
        ]);

        setProjects(projRes.data ?? []);
        setTasks(taskRes.data ?? []);
        setIdeas(ideaRes.data ?? []);
        setActivity(actRes.data ?? []);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // --- Derived data ---

  // Task status breakdown
  const taskStatusData = (() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const status = t.completed_at ? "done" : t.status || "todo";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Project status breakdown
  const projectStatusData = (() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Ideas by type
  const ideaTypeData = (() => {
    const counts: Record<string, number> = {};
    ideas.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Activity over the last 7 days
  const activityByDay = (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      days[key] = 0;
    }
    activity.forEach((a) => {
      const d = new Date(a.created_at);
      const key = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([day, actions]) => ({ day, actions }));
  })();

  // Ideas captured over time (cumulative by week)
  const ideasOverTime = (() => {
    if (ideas.length === 0) return [];
    const weekMap: Record<string, number> = {};
    ideas.forEach((idea) => {
      const d = new Date(idea.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(weekMap).map(([week, count]) => {
      cumulative += count;
      return { week, ideas: count, total: cumulative };
    });
  })();

  // Task priority breakdown
  const taskPriorityData = (() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Summary stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed_at).length;
  const totalIdeas = ideas.length;
  const totalActivity = activity.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BarChart3 className="h-6 w-6" /> Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your creative productivity and progress.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={totalProjects}
          sub={`${activeProjects} active`}
          color="var(--primary)"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={totalTasks}
          sub={`${completedTasks} completed`}
          color="var(--accent)"
        />
        <StatCard
          icon={Lightbulb}
          label="Ideas"
          value={totalIdeas}
          sub="captured"
          color="var(--warning)"
        />
        <StatCard
          icon={Activity}
          label="Activities"
          value={totalActivity}
          sub="logged"
          color="var(--success)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Status Pie */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckSquare className="h-5 w-5" /> Task Status
          </h2>
          {taskStatusData.length === 0 ? (
            <EmptyChart label="No tasks yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {taskStatusData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Over Time */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5" /> Activity (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="actions" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ideas Over Time */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Lightbulb className="h-5 w-5" /> Ideas Captured
          </h2>
          {ideasOverTime.length === 0 ? (
            <EmptyChart label="No ideas yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ideasOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--warning)"
                  strokeWidth={2}
                  dot={{ fill: "var(--warning)", r: 4 }}
                  name="Total ideas"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project & Task Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FolderKanban className="h-5 w-5" /> Project Status
          </h2>
          {projectStatusData.length === 0 ? (
            <EmptyChart label="No projects yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Idea Types */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Lightbulb className="h-5 w-5" /> Idea Types
          </h2>
          {ideaTypeData.length === 0 ? (
            <EmptyChart label="No ideas yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ideaTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {ideaTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task Priority */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-5 w-5" /> Task Priority Distribution
          </h2>
          {taskPriorityData.length === 0 ? (
            <EmptyChart label="No tasks yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskPriorityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {taskPriorityData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.name === "high"
                          ? "#ef4444"
                          : entry.name === "medium"
                            ? "var(--warning)"
                            : "var(--success)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label} &middot; {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
