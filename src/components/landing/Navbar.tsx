import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  Lightbulb,
  BarChart3,
  Shield,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

function scrollToSection(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

// --- Dropdown content for each nav item ---

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group rounded-lg p-4 transition-colors hover:bg-accent/50 cursor-pointer">
    <div className="flex items-start gap-3">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <h4 className="mb-1 text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

interface NavItem {
  name: string;
  href: string;
  content?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Features",
    href: "#features",
    content: (
      <div className="w-[520px] p-5">
        <div className="grid grid-cols-2 gap-2">
          <FeatureCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Idea Capture"
            description="Voice memos, notes, and files in one creative space"
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="AI-Powered Insights"
            description="Understand patterns in your creative workflow"
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Privacy First"
            description="End-to-end encryption for all your creative work"
          />
          <FeatureCard
            icon={<Workflow className="h-5 w-5" />}
            title="Smart Workflows"
            description="Intelligent project tracking that adapts to you"
          />
        </div>
      </div>
    ),
  },
  {
    name: "How It Works",
    href: "#how-it-works",
    content: (
      <div className="w-[400px] p-5">
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Sign Up Free",
              desc: "Create your account in seconds — no credit card required",
            },
            {
              step: "2",
              title: "Set Up Your Space",
              desc: "Import projects, invite collaborators, customize your workflow",
            },
            {
              step: "3",
              title: "Start Creating",
              desc: "Capture ideas, track progress, and finish projects faster",
            },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {s.step}
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  {s.title}
                </h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "Pricing",
    href: "#pricing",
    content: (
      <div className="w-[480px] p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              name: "Starter",
              price: "$9",
              features: ["5 active projects", "Basic idea capture"],
              highlighted: false,
            },
            {
              name: "Professional",
              price: "$29",
              features: ["Unlimited projects", "AI-powered insights"],
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              features: ["Custom integrations", "Priority support"],
              highlighted: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                tier.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => scrollToSection("#pricing")}
            >
              {tier.highlighted && (
                <div className="mb-2 -mt-1 text-center">
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Popular
                  </span>
                </div>
              )}
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                {tier.name}
              </h4>
              <div className="mb-3">
                <span className="text-xl font-bold text-foreground">
                  {tier.price}
                </span>
                {tier.price !== "Custom" && (
                  <span className="text-xs text-muted-foreground">/mo</span>
                )}
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 text-[var(--success)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "FAQ",
    href: "#faq",
  },
];

const mobileNavLinks = navItems.map((item) => ({
  label: item.name,
  href: item.href,
}));

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 100 && y > lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseEnter = (itemName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredItem(itemName);
    setActiveItem(itemName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setHoveredItem(null);
      setActiveItem(null);
    }, 150);
  };

  const handleDropdownMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleDropdownMouseLeave = () => {
    setHoveredItem(null);
    setActiveItem(null);
  };

  return (
    <>
      {/* Desktop: Floating pill navbar */}
      <div className="fixed top-5 left-1/2 z-50 hidden -translate-x-1/2 md:block">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
        >
          <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-3 py-2 shadow-lg backdrop-blur-xl">
            {/* Logo */}
            <Link to="/" className="mr-2 flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  F
                </span>
              </div>
              <span className="font-heading text-lg font-bold text-foreground">
                FlowState
              </span>
            </Link>

            {/* Nav items with dropdowns */}
            <div className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() =>
                    item.content
                      ? handleMouseEnter(item.name)
                      : setHoveredItem(item.name)
                  }
                  onMouseLeave={() => {
                    if (!item.content) setHoveredItem(null);
                    else handleMouseLeave();
                  }}
                >
                  <button
                    onClick={() => {
                      scrollToSection(item.href);
                      setActiveItem(null);
                      setHoveredItem(null);
                    }}
                    className="relative flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {item.name}
                    {item.content && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          activeItem === item.name ? "rotate-180" : ""
                        }`}
                      />
                    )}
                    {hoveredItem === item.name && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 -z-10 rounded-full bg-accent"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {activeItem === item.name && item.content && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="absolute left-1/2 top-full mt-3 -translate-x-1/2"
                        onMouseEnter={handleDropdownMouseEnter}
                        onMouseLeave={handleDropdownMouseLeave}
                      >
                        <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl">
                          {item.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right side: dark mode + CTAs */}
            <div className="ml-2 flex items-center gap-2 border-l border-border/50 pl-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDark}
                className="h-8 w-8 rounded-full p-0"
                aria-label="Toggle dark mode"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: dark ? 180 : 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  {dark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full text-sm"
              >
                <Link to="/auth/sign-in">Log In</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full text-sm">
                <Link to="/auth/sign-up">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile: Sticky header with hamburger */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                F
              </span>
            </div>
            <span className="font-heading text-lg font-bold text-foreground">
              FlowState
            </span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-8">
                <div className="flex flex-col gap-1">
                  {mobileNavLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <button
                        onClick={() => {
                          setOpen(false);
                          setTimeout(() => scrollToSection(link.href), 100);
                        }}
                        className="flex h-12 items-center rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {link.label}
                      </button>
                    </SheetClose>
                  ))}
                </div>
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={toggleDark}>
                    {dark ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {dark ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/auth/sign-in" onClick={() => setOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/sign-up" onClick={() => setOpen(false)}>
                      Start Free Trial
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
