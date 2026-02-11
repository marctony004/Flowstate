import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants, useReducedMotion } from "framer-motion";
import {
  FolderKanban,
  Lightbulb,
  CheckSquare,
  Users,
  Disc3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrainNode {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof FolderKanban;
  href: string;
  color: string;
  count: number;
  angle: number;
  details: string[];
  cta: string;
}

interface BrainMapCanvasProps {
  projectCount: number;
  ideaCount: number;
  taskCount: number;
  collaboratorCount: number;
  sessionTitle?: string;
  onNodeClick: (node: BrainNode) => void;
  onCenterClick: () => void;
  /** Fires when a background click resets focus — parent can close the inspector */
  onDismiss?: () => void;
}

// ---------------------------------------------------------------------------
// Node data factory
// ---------------------------------------------------------------------------

export function buildNodes(
  projectCount: number,
  ideaCount: number,
  taskCount: number,
  collaboratorCount: number,
): BrainNode[] {
  return [
    {
      id: "projects",
      label: "Projects",
      sublabel: `${projectCount} active`,
      icon: FolderKanban,
      href: "/dashboard/projects",
      color: "var(--primary)",
      count: projectCount,
      angle: -45,
      details: [
        `${projectCount} active session${projectCount !== 1 ? "s" : ""} in progress`,
        "Tracks your stems, mixes, and milestones",
        "Last updated moments ago",
      ],
      cta: "Open Projects",
    },
    {
      id: "ideas",
      label: "Ideas",
      sublabel: `${ideaCount} captured`,
      icon: Lightbulb,
      href: "/dashboard/ideas",
      color: "var(--warning)",
      count: ideaCount,
      angle: 45,
      details: [
        `${ideaCount} idea${ideaCount !== 1 ? "s" : ""} captured so far`,
        "Voice memos, lyrics, and sketches in one place",
        "Tag and link ideas to any session",
      ],
      cta: "Browse Ideas",
    },
    {
      id: "tasks",
      label: "Tasks",
      sublabel: `${taskCount} open`,
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "var(--success)",
      count: taskCount,
      angle: 135,
      details: [
        `${taskCount} open task${taskCount !== 1 ? "s" : ""} remaining`,
        "Prioritized by deadline and session context",
        "AI-parsed from natural language input",
      ],
      cta: "View Tasks",
    },
    {
      id: "collaborators",
      label: "Collaborators",
      sublabel: `${collaboratorCount} connected`,
      icon: Users,
      href: "/dashboard/collaborators",
      color: "var(--accent)",
      count: collaboratorCount,
      angle: -135,
      details: [
        `${collaboratorCount} collaborator${collaboratorCount !== 1 ? "s" : ""} connected`,
        "Track working styles and communication prefs",
        "Feedback linked to the right session and section",
      ],
      cta: "Manage Collaborators",
    },
  ];
}

// ---------------------------------------------------------------------------
// Shared motion variants
// ---------------------------------------------------------------------------

/**
 * Unique idle drift per node — returns memoised Variants.
 *
 * Variants:
 *   idle    — drifts gently, scale 1, full opacity
 *   settled — snaps to origin, scale 1, full opacity
 *   dimmed  — snaps to origin, scale 1, 0.7 opacity
 *   active  — snaps to origin, scale 1, full opacity (focused peripheral)
 *
 * Only x/y repeat in idle. Scale and opacity are always one-shot.
 */
function useIdleDrift(seed: number, amplitude: number, reducedMotion: boolean | null): Variants {
  return useMemo(() => {
    if (reducedMotion) {
      return {
        idle: { x: 0, y: 0, scale: 1, opacity: 1 },
        settled: { x: 0, y: 0, scale: 1, opacity: 1 },
        dimmed: { x: 0, y: 0, scale: 1, opacity: 0.7 },
        active: { x: 0, y: 0, scale: 1, opacity: 1 },
      };
    }
    const dx = Math.sin(seed * 1.7) * amplitude;
    const dy = Math.cos(seed * 2.3) * amplitude;
    const dur = 6 + (seed % 3);
    return {
      idle: {
        x: [0, dx, -dx * 0.6, 0],
        y: [0, -dy * 0.8, dy, 0],
        scale: 1,
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
          x: { duration: dur, repeat: Infinity, ease: "easeInOut" },
          y: { duration: dur, repeat: Infinity, ease: "easeInOut" },
        },
      },
      settled: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" },
      },
      dimmed: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 0.7,
        transition: {
          duration: 0.3,
          ease: "easeOut",
          opacity: { duration: 0.4, ease: "easeOut" },
        },
      },
      active: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" },
      },
    };
  }, [seed, amplitude, reducedMotion]);
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Orbit radius in viewBox units (480×480 coordinate space) */
const RADIUS = 180;

// ---------------------------------------------------------------------------
// Camera constants
// ---------------------------------------------------------------------------

interface Camera { x: number; y: number; scale: number }

const CAMERA_REST: Camera = { x: 0, y: 0, scale: 1 };
const CAMERA_ZOOM = 1.08;
/** Fraction of delta toward node — calm, not full lock */
const CAMERA_PAN = 0.35;
/** ms — wait for camera settle before opening inspector */
const INSPECT_DELAY = 400;
/** ms — shorter delay when switching between nodes */
const INSPECT_SWITCH_DELAY = 300;
const CAMERA_TRANSITION = "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)";

function cameraTargetForAngle(angle: number): Camera {
  const rad = (angle * Math.PI) / 180;
  const nx = 240 + RADIUS * Math.sin(rad);
  const ny = 240 - RADIUS * Math.cos(rad);
  return {
    x: ((240 - nx) / 480) * 100 * CAMERA_PAN,
    y: ((240 - ny) / 480) * 100 * CAMERA_PAN,
    scale: CAMERA_ZOOM,
  };
}

// ---------------------------------------------------------------------------
// Depth layer data (A: field pulses, B: ghost clusters)
// ---------------------------------------------------------------------------

interface FieldPip {
  /** Position as % of the surface */
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface GhostRing {
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
}

/** 2 pips per peripheral node (inward + outward) + 2 near center = 10 total */
const FIELD_PIPS: FieldPip[] = (() => {
  const pips: FieldPip[] = [];
  const angles = [-45, 45, 135, -135];

  angles.forEach((angle, i) => {
    const rad = (angle * Math.PI) / 180;
    // Inward pip: 65% along radius toward node
    const r1 = RADIUS * 0.65;
    pips.push({
      left: ((240 + r1 * Math.sin(rad)) / 480) * 100,
      top: ((240 - r1 * Math.cos(rad)) / 480) * 100,
      size: 12,
      delay: i * 1.8,
      duration: 7 + i * 0.7,
    });
    // Outward pip: 115% radius, +15° cross-angle offset
    const r2 = RADIUS * 1.15;
    const rad2 = ((angle + 15) * Math.PI) / 180;
    pips.push({
      left: ((240 + r2 * Math.sin(rad2)) / 480) * 100,
      top: ((240 - r2 * Math.cos(rad2)) / 480) * 100,
      size: 10,
      delay: i * 1.8 + 3,
      duration: 9 + i * 0.5,
    });
  });

  // 2 pips near center at asymmetric offsets
  pips.push({
    left: ((240 + 35 * Math.cos(Math.PI / 3)) / 480) * 100,
    top: ((240 - 35 * Math.sin(Math.PI / 3)) / 480) * 100,
    size: 10,
    delay: 2,
    duration: 8,
  });
  pips.push({
    left: ((240 + 30 * Math.cos(Math.PI * 1.17)) / 480) * 100,
    top: ((240 - 30 * Math.sin(Math.PI * 1.17)) / 480) * 100,
    size: 10,
    delay: 5.5,
    duration: 9.5,
  });

  return pips;
})();

/** 5 faint rings/ellipses scattered across the map for depth texture */
const GHOST_RINGS: GhostRing[] = [
  { left: 65, top: 22, width: 130, height: 130, rotation: 0 },
  { left: 18, top: 68, width: 100, height: 65, rotation: -18 },
  { left: 82, top: 50, width: 60, height: 60, rotation: 0 },
  { left: 30, top: 20, width: 80, height: 120, rotation: 14 },
  { left: 72, top: 80, width: 90, height: 90, rotation: 0 },
];

// ---------------------------------------------------------------------------
// Studio console action mapping
// ---------------------------------------------------------------------------

const CONSOLE_ACTIONS: Record<string, { actions: string[] }> = {
  projects: { actions: ["New Project", "View All"] },
  ideas: { actions: ["Add Idea", "Browse"] },
  tasks: { actions: ["Add Task", "View All"] },
  collaborators: { actions: ["Invite", "View All"] },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrainMapCanvas({
  projectCount,
  ideaCount,
  taskCount,
  collaboratorCount,
  sessionTitle = "Current Session",
  onNodeClick,
  onCenterClick,
  onDismiss,
}: BrainMapCanvasProps) {
  const nodes = buildNodes(projectCount, ideaCount, taskCount, collaboratorCount);
  const reducedMotion = useReducedMotion();

  // Focus: click locks focus, hover provides visual-only focus
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<Camera>(CAMERA_REST);
  const inspectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [settlePulseId, setSettlePulseId] = useState(0);

  // Action ping — when an entity is created via AskFlowState, ping the matching node
  const [pingedNodeId, setPingedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const entityToNodeId: Record<string, string> = {
      idea: "ideas",
      task: "tasks",
      project: "projects",
      collaborator: "collaborators",
    };
    const handler = (e: Event) => {
      const entityType = (e as CustomEvent).detail?.entityType;
      const nodeId = entityToNodeId[entityType];
      if (nodeId) {
        setPingedNodeId(nodeId);
        setTimeout(() => setPingedNodeId(null), 900);
      }
    };
    window.addEventListener("flowstate-action", handler);
    return () => window.removeEventListener("flowstate-action", handler);
  }, []);

  // Cleanup pending timer on unmount
  useEffect(() => () => {
    if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
  }, []);

  // Effective focus: click takes precedence over hover
  const focusedId = clickedId ?? hoveredId;
  const hasFocus = focusedId !== null;
  const centerFocused = focusedId === "center";
  const peripheralFocused = hasFocus && !centerFocused;

  // Hover is a preview state — suppressed while click-locked
  const handleHover = useCallback((id: string | null) => {
    if (clickedId !== null) return;
    setHoveredId(id);
  }, [clickedId]);

  // --- Click handlers ---

  const handlePeripheralClick = (node: BrainNode) => {
    // Already focused on this exact node — do nothing (prevents animation churn)
    if (clickedId === node.id) return;

    // New target — clear any pending inspector timer
    if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);

    // Reduced motion: no camera move, open inspector immediately
    if (reducedMotion) {
      setClickedId(node.id);
      onNodeClick(node);
      return;
    }

    const isSwitching = clickedId !== null;
    setClickedId(node.id);
    setCamera(cameraTargetForAngle(node.angle));
    setSettlePulseId(Date.now());

    // Delay inspector open until camera settles
    const delay = isSwitching ? INSPECT_SWITCH_DELAY : INSPECT_DELAY;
    inspectTimerRef.current = setTimeout(() => onNodeClick(node), delay);
  };

  const handleCenterClick = () => {
    if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
    setClickedId(null);
    setCamera(CAMERA_REST);
    onCenterClick();
  };

  const handleBackgroundClick = () => {
    if (clickedId) {
      if (inspectTimerRef.current) clearTimeout(inspectTimerRef.current);
      setClickedId(null);
      setCamera(CAMERA_REST);
      onDismiss?.();
    }
  };

  return (
    <div className="neural-field relative mx-auto flex items-center justify-center rounded-2xl" style={{ minHeight: 480 }}>
      {/* Inner square map surface — SVG and DOM nodes share this coordinate space */}
      <div data-brainmap="true" className="relative w-full max-w-[720px] aspect-square overflow-hidden rounded-2xl" onClick={handleBackgroundClick}>

        {/* Subtle radial vignette — visible when a peripheral is focused */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--foreground) 16%, transparent) 0%, transparent 60%)",
            opacity: peripheralFocused && !reducedMotion ? 0.08 : 0,
            transition: "opacity 0.35s ease-out",
          }}
        />

        {/* Camera layer — translates/scales toward focused node */}
        <div
          className="absolute inset-0 z-[2]"
          style={{
            transform: `translate(${camera.x}%, ${camera.y}%) scale(${camera.scale})`,
            transformOrigin: "center center",
            transition: reducedMotion ? "none" : CAMERA_TRANSITION,
          }}
        >
          {/* Depth layer — ghost clusters (B) + field pulses (A) */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {/* B) Ghost clusters — static faint rings for depth texture */}
            {GHOST_RINGS.map((ring, i) => (
              <div
                key={`ghost-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${ring.left}%`,
                  top: `${ring.top}%`,
                  width: ring.width,
                  height: ring.height,
                  transform: `translate(-50%, -50%) rotate(${ring.rotation}deg)`,
                  border: "1px solid color-mix(in srgb, var(--foreground) 16%, transparent)",
                  opacity: 0.12,
                }}
              />
            ))}

            {/* A) Field pulses — ambient breath pips near nodes */}
            {!reducedMotion &&
              FIELD_PIPS.map((pip, i) => (
                <motion.div
                  key={`pip-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: `${pip.left}%`,
                    top: `${pip.top}%`,
                    width: pip.size,
                    height: pip.size,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--primary) 35%, transparent) 0%, transparent 70%)",
                    filter: "blur(0.6px)",
                  }}
                  initial={{ opacity: 0.14 }}
                  animate={{ opacity: [0.14, 0.25, 0.14] }}
                  transition={{
                    duration: pip.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: pip.delay,
                  }}
                />
              ))}
          </div>

          {/* SVG connector lines */}
          <svg
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
            viewBox="0 0 480 480"
            preserveAspectRatio="xMidYMid meet"
          >
            {nodes.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const x2 = 240 + RADIUS * Math.sin(rad);
              const y2 = 240 - RADIUS * Math.cos(rad);
              const isNodeFocused = focusedId === node.id;
              const lineOpacity = !hasFocus ? 0.5 : isNodeFocused ? 0.45 : 0.3;
              const isSettling = !reducedMotion && clickedId === node.id && settlePulseId > 0;
              return (
                <motion.line
                  key={isSettling ? `${node.id}-${settlePulseId}` : node.id}
                  x1="240"
                  y1="240"
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="1"
                  strokeDasharray="6 4"
                  initial={isSettling ? { pathLength: 1, opacity: 0.45 } : { pathLength: 0, opacity: 0 }}
                  animate={isSettling
                    ? { pathLength: 1, opacity: [0.45, 0.55, 0.45] }
                    : { pathLength: 1, opacity: lineOpacity }
                  }
                  transition={isSettling
                    ? { duration: 0.2, ease: "easeOut" }
                    : { duration: 0.8, delay: 0.3 }
                  }
                />
              );
            })}

            {/* Traveling highlight — faint bright segment, one line at a time */}
            {!reducedMotion &&
              nodes.map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x2 = 240 + RADIUS * Math.sin(rad);
                const y2 = 240 - RADIUS * Math.cos(rad);
                return (
                  <motion.line
                    key={`hl-${node.id}`}
                    x1="240"
                    y1="240"
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    className="text-primary"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0.1 1"
                    initial={{ strokeDashoffset: 1.1, opacity: 0 }}
                    animate={{
                      strokeDashoffset: [1.1, -0.1],
                      opacity: [0, 0.12, 0.12, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      repeatDelay: 18,
                      delay: 1 + i * 6,
                      ease: "linear",
                      opacity: {
                        duration: 6,
                        times: [0, 0.08, 0.92, 1],
                        repeat: Infinity,
                        repeatDelay: 18,
                        delay: 1 + i * 6,
                      },
                    }}
                  />
                );
              })}

          </svg>

          {/* Center anchor — shared grid cell keeps glow, halo, and node aligned */}
          <div className="absolute left-1/2 top-1/2 z-[2] grid -translate-x-1/2 -translate-y-1/2 place-items-center">
            {/* Ambient glow — responds to center focus */}
            <motion.div
              className="pointer-events-none col-start-1 row-start-1 rounded-full"
              style={{
                width: 220,
                height: 220,
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)",
              }}
              animate={
                reducedMotion
                  ? { scale: 1, opacity: 0.5 }
                  : {
                      scale: centerFocused ? [1, 1.2, 1.1] : [1, 1.08, 1],
                      opacity: centerFocused ? [0.7, 0.5, 0.65] : [0.5, 0.3, 0.5],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: centerFocused ? 2 : 5, repeat: Infinity, ease: "easeInOut" }
              }
            />

            {/* Halo ring — slow radial pulse */}
            <motion.div
              className="pointer-events-none col-start-1 row-start-1 rounded-full"
              style={{
                width: 240,
                height: 240,
                background:
                  "radial-gradient(circle, transparent 42%, color-mix(in srgb, var(--primary) 6%, transparent) 55%, color-mix(in srgb, var(--primary) 3%, transparent) 65%, transparent 75%)",
              }}
              animate={
                reducedMotion
                  ? { opacity: 0.4 }
                  : {
                      opacity: [0.3, 0.55, 0.3],
                      scale: [1, 1.06, 1],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }
            />

            {/* Halo settle tighten — one-shot, fires after camera nearly settles */}
            {!reducedMotion && settlePulseId > 0 && clickedId && clickedId !== "center" && (
              <motion.div
                key={`halo-settle-${settlePulseId}`}
                className="pointer-events-none col-start-1 row-start-1 rounded-full"
                style={{
                  width: 240,
                  height: 240,
                  background:
                    "radial-gradient(circle, transparent 42%, color-mix(in srgb, var(--primary) 6%, transparent) 55%, color-mix(in srgb, var(--primary) 3%, transparent) 65%, transparent 75%)",
                }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 0.985, 1], opacity: [0, 0.04, 0] }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.35 }}
              />
            )}

            {/* Center node */}
            <CenterNode
              sessionTitle={sessionTitle}
              taskCount={taskCount}
              ideaCount={ideaCount}
              onCenterClick={handleCenterClick}
              focusedId={focusedId}
              setHoveredId={handleHover}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Peripheral nodes */}
          {nodes.map((node, i) => (
            <PeripheralNode
              key={node.id}
              node={node}
              index={i}
              focusedId={focusedId}
              clickedId={clickedId}
              settlePulseId={settlePulseId}
              setHoveredId={handleHover}
              onNodeClick={handlePeripheralClick}
              reducedMotion={reducedMotion}
              isPinged={pingedNodeId === node.id}
            />
          ))}
        </div>

        {/* Studio console — contextual action strip */}
        <StudioConsole
          focusedId={clickedId}
          nodes={nodes}
          onAction={handlePeripheralClick}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center node sub-component
// ---------------------------------------------------------------------------

function CenterNode({
  sessionTitle,
  taskCount,
  ideaCount,
  onCenterClick,
  focusedId,
  setHoveredId,
  reducedMotion,
}: {
  sessionTitle: string;
  taskCount: number;
  ideaCount: number;
  onCenterClick: () => void;
  focusedId: string | null;
  setHoveredId: (id: string | null) => void;
  reducedMotion: boolean | null;
}) {
  const drift = useIdleDrift(0, 2, reducedMotion);

  // Center settles whenever anything is focused; drifts only at rest
  const centerVariant = focusedId !== null ? "settled" : "idle";

  // Inner glow: brightest when center itself is focused
  const glowOpacity = focusedId === "center" ? 1 : focusedId !== null ? 0.5 : 0.4;

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onCenterClick();
      }}
      onHoverStart={() => setHoveredId("center")}
      onHoverEnd={() => setHoveredId(null)}
      className="z-10 col-start-1 row-start-1 flex h-[8.5rem] w-[8.5rem] flex-col items-center justify-center rounded-full border border-border/60 bg-card/90 backdrop-blur-sm sm:h-[9.5rem] sm:w-[9.5rem]"
      style={{
        boxShadow:
          "0 4px 24px color-mix(in srgb, var(--primary) 15%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
      }}
      variants={drift}
      initial={{ scale: 0, opacity: 0 }}
      animate={centerVariant}
      whileHover={{
        scale: 1.03,
        boxShadow:
          "0 4px 32px color-mix(in srgb, var(--primary) 25%, transparent), 0 1px 3px rgba(0,0,0,0.1)",
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
    >
      {/* Inner glow ring */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500"
        style={{
          boxShadow: "inset 0 0 20px color-mix(in srgb, var(--primary) 12%, transparent)",
          opacity: glowOpacity,
        }}
      />

      {/* Icon + "Now" status indicator */}
      <span className="flex items-center gap-1.5">
        <Disc3 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "var(--success)",
              boxShadow: "0 0 4px var(--success)",
            }}
          />
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[10px]">
            Now
          </span>
        </span>
      </span>

      {/* Session title */}
      <span className="mt-1 max-w-[6.5rem] truncate text-center text-[11px] font-medium leading-tight text-foreground sm:max-w-[7.5rem] sm:text-xs">
        {sessionTitle}
      </span>

      {/* Session metadata */}
      <span className="mt-0.5 text-[9px] text-muted-foreground sm:text-[10px]">
        {taskCount} tasks · {ideaCount} ideas
      </span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Peripheral node sub-component
// ---------------------------------------------------------------------------

function PeripheralNode({
  node,
  index,
  focusedId,
  clickedId,
  settlePulseId,
  setHoveredId,
  onNodeClick,
  reducedMotion,
  isPinged,
}: {
  node: BrainNode;
  index: number;
  focusedId: string | null;
  clickedId: string | null;
  settlePulseId: number;
  setHoveredId: (id: string | null) => void;
  onNodeClick: (node: BrainNode) => void;
  reducedMotion: boolean | null;
  isPinged?: boolean;
}) {
  const drift = useIdleDrift(index + 1, 3, reducedMotion);

  // Position in 480×480 viewBox coordinate space, then convert to percent
  const rad = (node.angle * Math.PI) / 180;
  const leftPct = ((240 + RADIUS * Math.sin(rad)) / 480) * 100;
  const topPct = ((240 - RADIUS * Math.cos(rad)) / 480) * 100;

  const isSelfFocused = focusedId === node.id;
  const hasFocus = focusedId !== null;

  // idle (nothing focused) → active (self focused) → dimmed (other focused)
  const nodeVariant = !hasFocus ? "idle" : isSelfFocused ? "active" : "dimmed";

  // Inner glow: visible when this node is focused, hidden otherwise
  const glowOpacity = isSelfFocused ? 0.8 : 0;

  // Subtle outward drift when another peripheral is focused (spatial attention)
  const isOtherPeripheralFocused = hasFocus && focusedId !== "center" && !isSelfFocused;
  const outwardPx = isOtherPeripheralFocused && !reducedMotion ? 4 : 0;
  const outwardX = Math.sin(rad) * outwardPx;
  const outwardY = -Math.cos(rad) * outwardPx;

  return (
    <div
      className="absolute z-[2]"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(-50%, -50%) translate(${outwardX}px, ${outwardY}px)`,
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* Ping glow ring — expands outward when entity is created via AskFlowState */}
      <AnimatePresence>
        {isPinged && (
          <motion.span
            key="ping-ring"
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: "7rem", height: "7rem" }}
            initial={{ scale: 0.85, opacity: 0.7 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          >
            <span
              className="block h-full w-full rounded-full"
              style={{
                boxShadow: `0 0 20px 8px color-mix(in srgb, ${node.color} 40%, transparent)`,
                border: `2px solid color-mix(in srgb, ${node.color} 35%, transparent)`,
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Bounce wrapper — only animates during ping, doesn't interfere with variant system */}
      <motion.div
        animate={isPinged ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={isPinged
          ? { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
          : { duration: 0 }
        }
      >
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          onHoverStart={() => setHoveredId(node.id)}
          onHoverEnd={() => setHoveredId(null)}
          className="group z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-border/50 bg-card/80 backdrop-blur-sm sm:h-28 sm:w-28"
          variants={drift}
          initial={{ scale: 0, opacity: 0 }}
          animate={nodeVariant}
          whileHover={{
            scale: 1.04,
            opacity: 1,
            boxShadow: `0 0 20px color-mix(in srgb, ${node.color} 20%, transparent)`,
            transition: { duration: 0.3, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.15 + index * 0.08,
          }}
        >
          {/* Soft inner glow — driven by focus state; shimmer on click settle */}
          {(() => {
            const isGlowSettling = clickedId === node.id && !reducedMotion && settlePulseId > 0;
            return (
              <motion.span
                key={isGlowSettling ? `glow-${settlePulseId}` : "glow"}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  boxShadow: `inset 0 0 14px color-mix(in srgb, ${node.color} 10%, transparent)`,
                }}
                initial={{ opacity: isGlowSettling ? glowOpacity : 0 }}
                animate={isGlowSettling
                  ? { opacity: [glowOpacity, glowOpacity + 0.12, glowOpacity] }
                  : { opacity: isPinged ? 0.8 : glowOpacity }
                }
                transition={isGlowSettling
                  ? { duration: 0.22, ease: "easeOut" }
                  : { duration: 0.3, ease: "easeOut" }
                }
              />
            );
          })()}
          <node.icon
            className="h-6 w-6 transition-colors duration-300 sm:h-7 sm:w-7"
            style={{ color: node.color }}
          />
          <span className="mt-1 text-[11px] font-semibold text-foreground sm:text-xs">
            {node.label}
          </span>
          <span className="text-[10px] text-muted-foreground transition-colors duration-300">
            {node.sublabel}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Studio console — contextual action strip
// ---------------------------------------------------------------------------

function StudioConsole({
  focusedId,
  nodes,
  onAction,
  reducedMotion,
}: {
  focusedId: string | null;
  nodes: BrainNode[];
  onAction: (node: BrainNode) => void;
  reducedMotion: boolean | null;
}) {
  const node = focusedId ? nodes.find((n) => n.id === focusedId) : null;
  const config = node ? CONSOLE_ACTIONS[node.id] : null;

  return (
    <AnimatePresence>
      {node && config && (
        <motion.div
          key="studio-console"
          className="pointer-events-none absolute bottom-5 left-1/2 z-[3] -translate-x-1/2"
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
          }
        >
          <div className="flex items-center gap-2.5 rounded-md border border-border/30 bg-card/40 px-3 py-1.5 backdrop-blur-sm">
            {/* Session indicator — dot + label */}
            <span className="flex items-center gap-1.5 opacity-70">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: node.color }}
              />
              <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                {node.label}
              </span>
            </span>

            {/* Divider */}
            <span className="h-3 w-px bg-border/40" />

            {/* Contextual actions */}
            {config.actions.map((label) => (
              <button
                key={label}
                className="pointer-events-auto whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/80 transition-colors duration-150 hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(node);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
