# NLP Project Requirements Checklist
## Miami Dade College - Advanced Natural Language Processing (Spring 2026)
## Dr. Lee - Full-Stack NLP Application with RAG Chatbot & Supabase Integration

**Due Date:** TBD
**Deliverables:** Live Netlify URL + One-Page Write-Up (PDF)
**Total Points:** 100

---

## Requirement 1: Authentication with Role-Based Access (15 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| Sign-up form with email/password via Supabase Auth | ☑ | `/auth/sign-up` - `SignUpPage.tsx` | Password strength meter included |
| Login form with email/password | ☑ | `/auth/sign-in` - `SignInPage.tsx` | Working with Supabase Auth |
| Logout functionality | ☑ | `DashboardLayout.tsx` sidebar | Sign Out button in user footer |
| Session persistence (refresh doesn't log out) | ☑ | `SessionContext.tsx` | `getSession()` + `onAuthStateChange` (fixed infinite spinner bug) |
| User roles stored in database | ☑ | `is_admin` column in `profiles` | Boolean for admin access |
| At least 2 distinct user roles | ☑ | `SessionContext.tsx` | Admin vs regular user |
| Conditional rendering based on role | ☑ | `DashboardLayout.tsx` | Admin nav section, badge |
| Route protection by role | ☑ | `admin/UsersPage.tsx` | Access denied for non-admins |
| **Test credentials in write-up** | ☐ | — | Create admin test account |

**Score estimate:** 14/15 (just need test credentials documented)

---

## Requirement 2: Editable User Profile (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| Dedicated profile page/modal | ☑ | `/dashboard/settings` | Full settings page |
| Editable display name | ☑ | `SettingsPage.tsx` | With min/max validation |
| Editable bio field | ☑ | `SettingsPage.tsx` | 500 char limit with counter |
| Editable avatar URL | ☑ | `SettingsPage.tsx` | With live preview |
| Form validation | ☑ | `SettingsPage.tsx` | react-hook-form + zod |
| Success/error feedback (toast) | ☑ | Using `sonner` | Success/error toasts |
| Data persists in Supabase `profiles` table | ☑ | `profiles` table | All fields saved |
| Changes persist after refresh | ☑ | `refreshProfile()` | Context updated on save |

**Score estimate:** 10/10

---

## Requirement 3: Supabase Database (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| PostgreSQL schema with 3+ tables | ☑ | Supabase | 11 tables total |
| Row Level Security (RLS) enabled | ☑ | Supabase | All tables have RLS on |
| Proper foreign key relationships | ☑ | Supabase | owner_id, project_id, etc. |
| pgvector extension enabled | ☑ | Supabase | For embeddings table |
| Schema diagram in write-up | ☐ | — | Create for documentation |

**Tables in FlowState (11 total):**
- `profiles` - user profiles (RLS ☑)
- `projects` - music projects (RLS ☑)
- `ideas` - creative ideas (RLS ☑)
- `tasks` - project tasks (RLS ☑)
- `collaborator_notes` - external collaborators (RLS ☑)
- `embeddings` - vector embeddings / pgvector, 11 rows (RLS ☑)
- `activity_log` - user activity tracking (RLS ☑)
- `milestones` - project milestones (RLS ☑)
- `project_members` - team members (RLS ☑)
- `chat_messages` - AI assistant conversation history (RLS ☑)
- `notifications` - in-app notification system (RLS ☑, Realtime ☑) — migration pending Supabase MCP re-auth

**Score estimate:** 9/10 (just need schema diagram)

---

## Requirement 4: Advanced UI Components (15 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| Component 1 from 21st.dev/ReactBits | ☑ | `GradientText` | Animated gradient headings |
| Component 2 from 21st.dev/ReactBits | ☑ | `BlurText` | Text reveal animation |
| Component 3 from 21st.dev/ReactBits | ☑ | `SpotlightCard` | Spotlight hover effect cards |
| Component 4 from 21st.dev/ReactBits | ☑ | `StarBorder` | Animated star border buttons |
| Components are functional (not decorative) | ☑ | Landing page | Enhance UX and visual appeal |
| Cohesive professional visual design | ☑ | Throughout | Tailwind + shadcn/ui |
| List components in write-up | ☐ | — | Document for submission |

**ReactBits Components Used (7 total - exceeds requirement of 4):**

| Component | File Location | Purpose |
|-----------|---------------|---------|
| ☑ `GradientText` | HeroSection, HowItWorksSection, PricingSection, SocialProofSection, BenefitsSection | Animated gradient text for headings |
| ☑ `BlurText` | HeroSection | Text reveal animation on page load |
| ☑ `Aurora` | Created in `src/components/reactbits/Aurora.tsx` | Animated aurora background (available) |
| ☑ `StarBorder` | FinalCTASection | Animated star border on CTA buttons |
| ☑ `CountUp` | SocialProofSection | Animated number counting (stats) |
| ☑ `SpotlightCard` | SocialProofSection | Cards with spotlight hover effect |
| ☑ `GlareHover` | BenefitsSection | Hover glare effect on cards |

**Component Files:** `src/components/reactbits/`

**Score estimate:** 14/15 (just need to document in write-up)

---

## Requirement 5: Supabase Edge Functions (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| At least 1 Edge Function deployed | ☑ | Supabase | 6 deployed and ACTIVE |
| Meaningful operation | ☑ | — | AI/NLP embedding + search + chat + parsing + batch regen + voice actions |
| Proper error handling | ☑ | — | Try/catch, error responses, CORS headers |
| Secure API key handling | ☑ | Supabase secrets | GEMINI_API_KEY in env |
| Document in write-up | ☐ | — | 6 functions: names + descriptions |

**Deployed Edge Functions (6 total - all ACTIVE):**
- ☑ `generate-embedding` v4 — Generates vector embeddings via Gemini gemini-embedding-001 (768d)
- ☑ `semantic-search` v3 — Performs pgvector similarity search across user content
- ☑ `ask-flowstate` v17 — RAG chatbot: embeds question → retrieves context → Gemini 2.5 Flash generates answer
- ☑ `parse-task-nl` v3 — Natural language task parsing via Gemini
- ☑ `regenerate-embeddings` v1 — Batch re-embeds all entities for a user (model migration utility)
- ☑ `vapi-actions` — Server-side handler for Vapi voice assistant tool calls (create idea/task/project, query workspace)

**Score estimate:** 10/10

---

## Requirement 6: MCP Server Integration (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| At least 1 MCP server integrated | ☑ | `.mcp.json` | Multiple MCPs configured |
| MCP adds genuine value | ☑ | — | Used for development |
| Document in write-up | ☐ | — | Explain MCP usage |

**MCP Servers in Use:**
- ☑ `supabase` - Supabase MCP for database operations
- ☑ `magic` - 21st.dev Magic MCP for UI components
- ☑ `reactbits` - ReactBits MCP for animated components

**Score estimate:** 9/10 (just need to document)

---

## Requirement 7: RAG Chatbot with pgvector (20 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| pgvector extension enabled | ☑ | Supabase | Extension active |
| Embeddings table with vector column | ☑ | `embeddings` table | vector(768), 11 rows (7 ideas, 3 projects, 1 task), user_id column added |
| Content ingestion pipeline | ☑ | `useEmbedding` hook | Auto-generates on create/update in IdeaDialog, TaskDialog, ProjectDialog |
| Embedding generation via API | ☑ | `generate-embedding` Edge Function v4 | Gemini gemini-embedding-001 (768d) |
| Similarity search function | ☑ | `search_embeddings` SQL RPC | Cosine similarity, top-k |
| Chat interface UI | ☑ | `AskFlowState.tsx` | Side panel with voice I/O |
| Retrieves context via pgvector | ☑ | `ask-flowstate` Edge Function | Searches embeddings, enriches with entity metadata |
| Sends context + question to LLM | ☑ | `ask-flowstate` Edge Function v17 | Gemini 2.5 Flash with system prompt + conversation history |
| Chat history displayed in UI | ☑ | `AskFlowState.tsx` | Messages array in state |
| Chat history stored in database | ☑ | `chat_messages` table | Persisted via `AskFlowState.tsx` |
| Example questions in write-up | ☐ | — | Document 3+ examples |

**RAG Pipeline (fully functional — verified working Feb 10, 2026):**
1. User asks question in AskFlowState panel (supports voice input via Web Speech API)
2. `ask-flowstate` v17 embeds question via Gemini gemini-embedding-001 (768d)
3. pgvector `search_embeddings` RPC finds relevant ideas/projects/tasks (filters by user_id)
4. Context enriched with full entity details from source tables
5. **Gemini 2.5 Flash** generates answer with system prompt + conversation history (up to 6 turns)
6. Response displayed with source citations (entity type, title, excerpt, similarity %)

**Bugs Fixed:**
- ~~Missing `user_id` column~~ — Migration applied, backfilled, index created
- ~~Rule-based answers~~ — Replaced with real Gemini 2.5 Flash LLM
- ~~Retired Gemini models~~ — Upgraded from text-embedding-004/gemini-1.5-flash to gemini-embedding-001/gemini-2.5-flash
- ~~Old embeddings incompatible~~ — All entities re-embedded with new model via `regenerate-embeddings`

**Score estimate:** 20/20 (chat history persisted, Vapi voice I/O, real-time notifications on AI actions)

---

## Requirement 8: One-Page Write-Up (10 pts)

| Item | Status | Notes |
|------|--------|-------|
| Brief app description | ☐ | FlowState: Creative Intelligence OS for musicians |
| Requirements mapping table | ☐ | Map each requirement to location |
| Testing instructions per requirement | ☐ | Step-by-step guide |
| Test credentials provided | ☐ | Admin + member accounts |
| 21st.dev/ReactBits components listed | ☐ | 7 components with locations |
| Edge Functions documented | ☐ | 4 functions: names + descriptions |
| MCP servers documented | ☐ | Which ones + how to test |
| 3+ RAG chatbot example questions | ☐ | Questions that work well |

**Score estimate:** 0/10 (not started)

---

## Deployment Checklist

| Item | Status | Notes |
|------|--------|-------|
| Application deployed to Netlify | ☑ | https://flowstateos.netlify.app/ |
| Environment variables configured | ☑ | Supabase URL, Anon Key set in Netlify |
| Build succeeds without errors | ☑ | `npm run build` verified |
| All features work in production | ☑ | Login tested on desktop + iPad |
| CORS configured correctly | ☑ | Supabase redirect URLs configured |
| Test with fresh account | ☑ | Google OAuth working |

---

## Priority Action Items

### CRITICAL — FIXED
1. ☑ ~~**Fix embeddings `user_id` column**~~ — Migration applied: added `user_id uuid`, backfilled 6 rows, deleted 1 orphan, index created. `search_embeddings` RPC optimized. `generate-embedding` v3 stores user_id. **`ask-flowstate` v13 now uses real Gemini 1.5 Flash** (was rule-based).

### Required for Submission
2. ☐ **Write one-page PDF** — Testing guide with credentials, requirement mapping, example questions
3. ☐ **Create test accounts** — Admin + regular user accounts with credentials for grader

### Recommended (Strengthen Submission)
4. ☐ **Create schema diagram** — Visual ER diagram for write-up (11 tables)

### Already Complete
- ☑ User roles + admin UI
- ☑ Editable profile (name, bio, avatar, timezone, role)
- ☑ 7 ReactBits components integrated
- ☑ 6 Edge Functions deployed (generate-embedding v4, semantic-search v3, ask-flowstate v17, parse-task-nl v3, regenerate-embeddings v1, vapi-actions)
- ☑ RAG chatbot UI with voice I/O (Web Speech API + Vapi)
- ☑ LLM integration — Gemini 2.5 Flash for answer generation (v17)
- ☑ Embedding pipeline hooked into entity CRUD (gemini-embedding-001)
- ☑ Semantic search verified end-to-end (user_id filtering, 11 embeddings)
- ☑ Session refresh bug fixed (getSession() + onAuthStateChange)
- ☑ Deployed to Netlify
- ☑ Chat history persisted to `chat_messages` table
- ☑ In-app notifications system (NotificationBell, realtime, preferences, 4 call sites)
- ☑ Vapi voice assistant with tool calls (create idea/task/project, query workspace)

---

## Estimated Score (Current State)

| Requirement | Points | Estimate | Notes |
|-------------|--------|----------|-------|
| 1. Auth & Roles | 15 | 14 | Need test credentials in write-up |
| 2. Profile | 10 | 10 | Complete |
| 3. Database | 10 | 9 | Need schema diagram |
| 4. UI Components | 15 | 14 | Need to list in write-up |
| 5. Edge Functions | 10 | 10 | 6 deployed, exceeds requirement |
| 6. MCP Integration | 10 | 9 | Need to document |
| 7. RAG Chatbot | 20 | 20 | Complete: LLM, pgvector RAG, chat persistence, voice I/O (Vapi) |
| 8. Write-Up | 10 | 0 | Not started |
| **Total** | **100** | **86–90** | |

**After writing PDF: ~96–100/100**

---

## Testing Guide Template (For Write-Up)

### App Description
FlowState is a Creative Intelligence OS designed for musicians and producers. It helps users capture ideas, manage projects, track tasks, and leverage AI-powered semantic search to query their creative work using natural language.

### Test Credentials
- **Admin Account:** admin@test.com / [password]
- **Member Account:** member@test.com / [password]

### Requirement Testing

| Req | How to Test |
|-----|-------------|
| 1. Auth & Roles | Sign up → Log in → Check admin nav (admin only) → Visit User Management → Log out |
| 2. Profile | Settings → Edit display name, bio, avatar URL → Save → Refresh → Verify persistence |
| 3. Database | Create project → Create idea → Create task → Check dashboard counts update |
| 4. UI Components | Landing page: GradientText headings, BlurText hero, CountUp stats, SpotlightCard testimonials, GlareHover benefits, StarBorder CTA |
| 5. Edge Functions | Create an idea → embedding auto-generated. Ask AI a question → triggers ask-flowstate function |
| 6. MCP | Used Supabase MCP, Magic MCP (21st.dev), ReactBits MCP during development |
| 7. RAG Chatbot | Click floating AI button → Ask "What ideas have I captured?" → See answer with citations |

### RAG Chatbot Example Questions
1. "How many ideas do I have?"
2. "What projects am I working on?"
3. "What tasks are linked to my project?"
4. "Summarize my recent activity"

---

**Document Version:** 4.0
**Last Updated:** February 11, 2026
**Status:** In Progress — All technical requirements complete. Remaining: write-up PDF + test accounts + schema diagram
**Live URL:** https://flowstateos.netlify.app/
