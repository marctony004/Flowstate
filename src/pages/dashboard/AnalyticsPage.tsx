import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Lightbulb,
  CheckSquare,
  FolderKanban,
  Activity,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Project, Task, Idea, ActivityLog } from "@/types/database";

const CHART_COLORS = ["#7986CB", "#00BCD4", "#8BC34A", "#FF9800", "#E91E63", "#9575CD"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 px-3 py-2.5 shadow-2xl backdrop-blur-sm">
      {label && (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color || p.fill || p.stroke }}
          />
          <span className="text-sm font-bold text-foreground">{p.value}</span>
          {p.name && (
            <span className="text-xs text-muted-foreground">{p.name}</span>
          )}
        </div>
      ))}
    </div>
  );
};

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
          supabase.from("projects").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
          supabase.from("tasks").select("*").eq("created_by", userId).order("created_at", { ascending: true }),
          supabase.from("ideas").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
          supabase.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
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

  const taskStatusData = (() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const status = t.completed_at ? "done" : t.status || "todo";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const projectStatusData = (() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const ideaTypeData = (() => {
    const counts: Record<string, number> = {};
    ideas.forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const activityByDay = (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      days[key] = 0;
    }
    activity.forEach((a) => {
      const d = new Date(a.created_at);
      const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([day, actions]) => ({ day, actions }));
  })();

  const ideasOverTime = (() => {
    if (ideas.length === 0) return [];
    const weekMap: Record<string, number> = {};
    ideas.forEach((idea) => {
      const d = new Date(idea.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(weekMap).map(([week, count]) => {
      cumulative += count;
      return { week, ideas: count, total: cumulative };
    });
  })();

  const taskPriorityData = (() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed_at).length;
  const totalIdeas = ideas.length;
  const totalActivity = activity.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activePercent = totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0;
  const weeklyActivity = activityByDay.reduce((sum, d) => sum + d.actions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Creative Flow
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your productivity at a glance.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>{weeklyActivity} actions this week</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={totalProjects}
          sub={`${activeProjects} active`}
          color="var(--primary)"
          progress={activePercent}
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={totalTasks}
          sub={`${completedTasks} completed`}
          color="var(--accent)"
          progress={completionRate}
        />
        <StatCard
          icon={Lightbulb}
          label="Ideas"
          value={totalIdeas}
          sub="captured"
          color="var(--warning)"
        />
        <StatCard
          icon={Zap}
          label="Activity"
          value={totalActivity}
          sub="actions logged"
          color="var(--success)"
        />
      </div>

      {/* Full-width: Activity Over 7 Days */}
      <ChartCard
        title="Activity Timeline"
        subtitle="Last 7 days"
        icon={TrendingUp}
        accentColor="var(--primary)"
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activityByDay} barSize={28} barCategoryGap="35%">
            <defs>
              <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7986CB" stopOpacity={1} />
                <stop offset="100%" stopColor="#3F51B5" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
            <Bar dataKey="actions" fill="url(#actGrad)" radius={[6, 6, 0, 0]} name="Actions" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2: Task Donut + Project Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Completion Donut */}
        <ChartCard
          title="Task Completion"
          subtitle={`${completionRate}% done`}
          icon={CheckSquare}
          accentColor="var(--accent)"
        >
          {taskStatusData.length === 0 ? (
            <EmptyChart icon={CheckSquare} label="No tasks yet" />
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={105}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {taskStatusData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center stat overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold tracking-tight text-foreground">
                      {completionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">complete</p>
                  </div>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-3">
                {taskStatusData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Project Status */}
        <ChartCard
          title="Project Status"
          subtitle={`${totalProjects} total`}
          icon={FolderKanban}
          accentColor="var(--primary)"
        >
          {projectStatusData.length === 0 ? (
            <EmptyChart icon={FolderKanban} label="No projects yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectStatusData} layout="vertical" barSize={22}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00BCD4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7986CB" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  width={72}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="value" fill="url(#projGrad)" radius={[0, 6, 6, 0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Ideas Area + Idea Types Donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ideas Over Time - Area */}
        <ChartCard
          title="Ideas Captured"
          subtitle="Cumulative growth"
          icon={Lightbulb}
          accentColor="var(--warning)"
        >
          {ideasOverTime.length === 0 ? (
            <EmptyChart icon={Lightbulb} label="No ideas yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ideasOverTime}>
                <defs>
                  <linearGradient id="ideaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF9800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#FF9800"
                  strokeWidth={2.5}
                  fill="url(#ideaGrad)"
                  dot={{ fill: "#FF9800", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#FF9800", strokeWidth: 0 }}
                  name="Total ideas"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Idea Types Donut */}
        <ChartCard
          title="Idea Types"
          subtitle="By category"
          icon={Lightbulb}
          accentColor="var(--premium)"
        >
          {ideaTypeData.length === 0 ? (
            <EmptyChart icon={Lightbulb} label="No ideas yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ideaTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {ideaTypeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {ideaTypeData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Task Priority */}
      <ChartCard
        title="Task Priority Distribution"
        subtitle="Across all tasks"
        icon={Zap}
        accentColor="var(--warning)"
      >
        {taskPriorityData.length === 0 ? (
          <EmptyChart icon={Zap} label="No tasks yet" />
        ) : (
          <div className="space-y-3 py-2">
            {(["high", "medium", "low"] as const).map((level) => {
              const entry = taskPriorityData.find((d) => d.name === level);
              const count = entry?.value ?? 0;
              const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              const color =
                level === "high" ? "#ef4444" : level === "medium" ? "#FF9800" : "#8BC34A";
              return (
                <div key={level} className="flex items-center gap-4">
                  <span
                    className="w-14 text-right text-xs font-semibold capitalize"
                    style={{ color }}
                  >
                    {level}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted h-3">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-muted-foreground">
                    {count} · {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
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
  progress,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  sub: string;
  color: string;
  progress?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      {/* Top gradient accent stripe */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 75%)` }}
      />
      {/* Soft background glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: color, opacity: 0.07 }}
      />
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground/80">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-[10px] text-muted-foreground">progress</span>
            <span className="text-[10px] font-semibold" style={{ color }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof BarChart3;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Top gradient accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px]"
        style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 65%)` }}
      />
      {/* Soft glow */}
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: accentColor, opacity: 0.05 }}
      />
      <div className="p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyChart({
  icon: Icon,
  label,
}: {
  icon: typeof BarChart3;
  label: string;
}) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground/60">{label}</p>
    </div>
  );
}
