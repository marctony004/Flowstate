import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---

export interface TimelineClip {
  /** Label shown on the clip badge */
  label: string;
  /** Track index (0-based) */
  track: number;
  /** Start position as percentage 0-100 */
  startPercent: number;
  /** Width as percentage 0-100 */
  widthPercent: number;
  /** Color token name — maps to CSS var */
  color: "primary" | "accent" | "warning" | "success" | "spark" | "premium";
}

export interface TimelineMarker {
  /** Position as percentage 0-100 */
  positionPercent: number;
  /** Optional label shown above the marker */
  label?: string;
}

interface SessionTimelineProps {
  clips: TimelineClip[];
  markers?: TimelineMarker[];
  trackCount?: number;
  size?: "sm" | "md" | "lg";
  showPlayhead?: boolean;
  showRuler?: boolean;
  animateIn?: boolean;
  className?: string;
}

// --- Helpers ---

const trackHeights: Record<string, string> = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

const clipTextSizes: Record<string, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
};

const colorMap: Record<TimelineClip["color"], string> = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  warning: "var(--warning)",
  success: "var(--success)",
  spark: "var(--spark)",
  premium: "var(--premium)",
};

/** Tiny inline SVG waveform bars to fill clips */
function WaveformBars({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.12]"
      preserveAspectRatio="none"
      viewBox="0 0 120 24"
      aria-hidden
    >
      {Array.from({ length: 30 }).map((_, i) => {
        const h = 4 + Math.sin(i * 0.9) * 6 + Math.cos(i * 1.7) * 4;
        return (
          <rect
            key={i}
            x={i * 4}
            y={12 - h / 2}
            width={2}
            height={h}
            rx={0.5}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

// --- Component ---

export default function SessionTimeline({
  clips,
  markers = [],
  trackCount = 3,
  size = "md",
  showPlayhead = false,
  showRuler = false,
  animateIn = true,
  className,
}: SessionTimelineProps) {
  const height = trackHeights[size];
  const textSize = clipTextSizes[size];

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* Ruler */}
      {showRuler && (
        <div className="flex h-6 items-end border-b border-border/40 mb-px">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 relative"
            >
              <div className="absolute left-0 bottom-0 h-2 w-px bg-muted-foreground/30" />
              <span className="absolute left-1 bottom-0.5 text-[8px] text-muted-foreground/50 leading-none">
                {i * 4}s
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Track rows */}
      <div className="relative">
        {Array.from({ length: trackCount }).map((_, trackIdx) => (
          <div
            key={trackIdx}
            className={cn(
              height,
              "relative border-b border-border/20 bg-card/50",
              trackIdx === 0 && !showRuler && "rounded-t-md",
              trackIdx === trackCount - 1 && "rounded-b-md border-b-0"
            )}
          />
        ))}

        {/* Clips layer — positioned absolutely over tracks */}
        {clips.map((clip, i) => {
          const cssColor = colorMap[clip.color];
          const topPercent = (clip.track / trackCount) * 100;
          const trackPercent = (1 / trackCount) * 100;

          const baseStyle: React.CSSProperties = {
            left: `${clip.startPercent}%`,
            width: `${clip.widthPercent}%`,
            top: `calc(${topPercent}% + 3px)`,
            height: `calc(${trackPercent}% - 6px)`,
            backgroundColor: `color-mix(in srgb, ${cssColor} 25%, transparent)`,
            ...(animateIn ? { transformOrigin: "left center" } : {}),
          };

          return (
            <motion.div
              key={`${clip.label}-${i}`}
              className={cn(
                "absolute flex items-center gap-1 rounded-md px-1.5 overflow-hidden cursor-default",
                "border border-white/10",
                "transition-shadow duration-200",
                `clip-glow-${clip.color}`
              )}
              style={baseStyle}
              {...(animateIn
                ? {
                    initial: { scaleX: 0, opacity: 0 },
                    whileInView: { scaleX: 1, opacity: 1 },
                    viewport: { once: true, margin: "-40px" },
                    transition: {
                      duration: 0.4,
                      delay: i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                : {})}
              whileHover={{ scale: 1.02 }}
            >
              <WaveformBars color={cssColor} />
              {/* Label badge */}
              <span
                className={cn(
                  textSize,
                  "relative z-10 whitespace-nowrap font-medium leading-none rounded px-1 py-0.5"
                )}
                style={{ color: cssColor }}
              >
                {clip.label}
              </span>
            </motion.div>
          );
        })}

        {/* Markers */}
        {markers.map((marker, i) => {
          const markerStyle: React.CSSProperties = {
            left: `${marker.positionPercent}%`,
            backgroundColor: "var(--muted-foreground)",
            opacity: 0.25,
            ...(animateIn ? { transformOrigin: "bottom" } : {}),
          };

          return (
          <motion.div
            key={`marker-${i}`}
            className="absolute top-0 bottom-0 w-px"
            style={markerStyle}
            {...(animateIn
              ? {
                  initial: { scaleY: 0 },
                  whileInView: { scaleY: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.4, delay: 0.3 + i * 0.1 },
                }
              : {})}
          >
            {marker.label && (
              <span className="absolute -top-4 left-1 text-[8px] text-muted-foreground whitespace-nowrap">
                {marker.label}
              </span>
            )}
          </motion.div>
          );
        })}

        {/* Playhead */}
        {showPlayhead && (
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-spark z-20 rounded-full"
            style={{ boxShadow: "0 0 6px var(--spark)" }}
            initial={{ left: "0%" }}
            animate={{ left: "100%" }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </div>
    </div>
  );
}
