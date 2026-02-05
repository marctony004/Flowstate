# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (default port 5173)
npm run build    # Type-check with tsc then bundle with Vite
npm run lint     # ESLint with zero-warning policy
npm run preview  # Preview production build locally
```

No test framework is configured.

## Architecture

**FlowState** is a React 19 SPA for creative professionals (musicians/producers). It uses Supabase for auth, Vite for builds, and Tailwind CSS 4 with CSS custom properties for theming.

### Routing (`src/router/index.tsx`)

Two route trees share the `/` base path:
- **Landing page** (`/`) — renders `LandingPage` directly, no providers needed
- **App routes** — wrapped in `<Providers>` (which supplies `SessionProvider`):
  - `/app` — authenticated home hub
  - `/auth/sign-in`, `/auth/sign-up`, `/auth/callback` — public auth flows
  - `/protected`, `/dashboard` — behind `AuthProtectedRoute`

`AuthProtectedRoute` reads `useSession()` and renders `NotFoundPage` (not a redirect) when unauthenticated.

### Auth (`src/context/SessionContext.tsx`)

`SessionProvider` listens to `supabase.auth.onAuthStateChange()` and exposes session via `useSession()` hook. Shows `LoadingPage` until the initial auth check completes.

### Environment Variables

Required in `.env` (Vite-prefixed):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Validated at startup in `src/config.ts` — app throws if either is missing.

### Styling

- **Tailwind CSS 4** via `@tailwindcss/vite` plugin — no `tailwind.config` file; config lives in `src/index.css` using `@theme inline`
- **shadcn/ui** (New York style) — components in `src/components/ui/`, configured via `components.json`
- **Brand tokens** as CSS custom properties: `--primary` (Flow Indigo #3F51B5), `--accent` (Insight Teal #00BCD4), `--success` (Momentum Green #8BC34A), `--warning` (Vibe Orange #FF9800)
- **Fonts**: Poppins for headings (`font-heading`), Inter for body (`font-body`) — loaded from Google Fonts
- Dark mode via `.dark` class

### Path Alias

`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

### Landing Page (`src/components/landing/`)

Marketing page composed of section components: Navbar, HeroSection, BenefitsSection, SocialProofSection, ProductShowcaseSection, ROICalculatorSection, PricingSection, FAQSection, FinalCTASection, Footer. Uses framer-motion for scroll animations.

### Key Libraries

- `framer-motion` — scroll-triggered animations on landing page
- `react-hook-form` + `zod` + `@hookform/resolvers` — form handling
- `recharts` — available for charts
- `lucide-react` — icon library
