import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

function scrollToSection(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">F</span>
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            FlowState
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/auth/sign-in">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/sign-up">Start Free Trial</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-6 pt-8">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
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
  );
}
