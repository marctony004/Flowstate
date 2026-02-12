interface WaveDividerProps {
  flip?: boolean;
  className?: string;
  variant?: "soft" | "sharp" | "double";
}

export default function WaveDivider({
  flip = false,
  className = "",
  variant = "soft",
}: WaveDividerProps) {
  const paths: Record<string, string> = {
    soft: "M0,64 C320,120 640,0 960,56 C1280,112 1440,32 1440,32 L1440,0 L0,0 Z",
    sharp: "M0,48 L360,80 L720,16 L1080,64 L1440,24 L1440,0 L0,0 Z",
    double:
      "M0,48 C240,96 480,16 720,56 C960,96 1200,24 1440,48 L1440,0 L0,0 Z",
  };

  return (
    <div
      className={`pointer-events-none relative z-[3] -my-px ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-16 lg:h-20"
        aria-hidden
      >
        <path
          d={paths[variant]}
          className="fill-background"
        />
      </svg>
    </div>
  );
}
