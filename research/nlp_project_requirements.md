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
| Session persistence (refresh doesn't log out) | ☑ | `SessionContext.tsx` | `onAuthStateChange` listener |
| User roles stored in database | ☑ | `is_admin` column in `profiles` | Boolean for admin access |
| At least 2 distinct user roles | ☑ | `SessionContext.tsx` | Admin vs regular user |
| Conditional rendering based on role | ☑ | `DashboardLayout.tsx` | Admin nav section, badge |
| Route protection by role | ☑ | `admin/UsersPage.tsx` | Access denied for non-admins |
| **Test credentials in write-up** | ☐ | — | Create admin test account |

**Cross-reference:** See MVP Checklist Phase 7 (Forms & Lead Capture)

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

**Cross-reference:** See MVP Checklist Phase 7B.2 (may need new SettingsPage features)

---

## Requirement 3: Supabase Database (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| PostgreSQL schema with 3+ tables | ☑ | Supabase | projects, ideas, tasks, collaborators, embeddings, activity_log, etc. |
| Row Level Security (RLS) enabled | ☑ | Supabase | Policies on main tables |
| Proper foreign key relationships | ☑ | Supabase | owner_id, project_id references |
| pgvector extension enabled | ☑ | Supabase | For embeddings table |
| Schema diagram in write-up | ☐ | — | Create for documentation |

**Tables in FlowState:**
- `profiles` - user profiles
- `projects` - music projects
- `ideas` - creative ideas
- `tasks` - project tasks
- `collaborators` - external collaborators
- `embeddings` - vector embeddings (pgvector)
- `activity_log` - user activity tracking
- `milestones` - project milestones
- `project_members` - team members

**Cross-reference:** See MVP Checklist Phase 8A.2 (Semantic Search infrastructure)

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
| ☑ `Aurora` | HeroSection | Animated aurora background effect |
| ☑ `StarBorder` | FinalCTASection | Animated star border on CTA buttons |
| ☑ `CountUp` | SocialProofSection | Animated number counting (stats) |
| ☑ `SpotlightCard` | SocialProofSection | Cards with spotlight hover effect |
| ☑ `GlareHover` | BenefitsSection | Hover glare effect on cards |

**Component Files:** `src/components/reactbits/`

**Cross-reference:** See MVP Checklist Phase 4 (Solution, Features & Social Proof)

---

## Requirement 5: Supabase Edge Functions (10 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| At least 1 Edge Function deployed | ☑ | Supabase | Multiple deployed |
| Meaningful operation | ☑ | — | AI/NLP operations |
| Proper error handling | ☑ | — | Try/catch, error responses |
| Secure API key handling | ☑ | Supabase secrets | GEMINI_API_KEY in env |
| Document in write-up | ☐ | — | List all functions |

**Deployed Edge Functions:**
- ☑ `generate-embedding` - Generates vector embeddings via Gemini API
- ☑ `semantic-search` - Performs pgvector similarity search
- ☑ `ask-flowstate` - RAG chatbot with context retrieval + answer generation

**Cross-reference:** See MVP Checklist Phase 8A (AI/NLP Intelligence Layer)

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

**Cross-reference:** Project uses MCPs for development workflow

---

## Requirement 7: RAG Chatbot with pgvector (20 pts)

| Item | Status | FlowState Location | Notes |
|------|--------|-------------------|-------|
| pgvector extension enabled | ☑ | Supabase | Extension active |
| Embeddings table with vector column | ☑ | `embeddings` table | vector(768) column |
| Content ingestion pipeline | ☑ | `useEmbedding` hook | Auto-generates on create/update |
| Embedding generation via API | ☑ | `generate-embedding` Edge Function | Gemini text-embedding-004 |
| Similarity search function | ☑ | `search_embeddings` SQL function | Cosine similarity, top-k |
| Chat interface UI | ☑ | `AskFlowState.tsx` | Side panel with messages |
| Retrieves context via pgvector | ☑ | `ask-flowstate` Edge Function | Searches embeddings first |
| Sends context + question to LLM | ⚠️ | `ask-flowstate` | Currently rule-based (Gemini chat failing) |
| Chat history displayed in UI | ☑ | `AskFlowState.tsx` | Messages array in state |
| Chat history stored in database | ☐ | — | Optional, not implemented |
| Example questions in write-up | ☐ | — | Document 3+ examples |

**RAG Pipeline:**
1. User asks question in AskFlowState panel
2. Question embedded via Gemini text-embedding-004
3. pgvector similarity search finds relevant ideas/projects/tasks
4. Context enriched with full entity details
5. Smart answer generated based on question type + context
6. Response displayed with source citations

**Known Issue:** Gemini chat API not working; using rule-based `generateSmartAnswer` instead. Consider switching to OpenAI/Claude for production.

**Cross-reference:** See MVP Checklist Phase 8A.3 (Personal Creative Memory / Session Recall)

---

## Requirement 8: One-Page Write-Up (10 pts)

| Item | Status | Notes |
|------|--------|-------|
| Brief app description | ☐ | FlowState: Creative Intelligence OS for musicians |
| Requirements mapping table | ☐ | Map each requirement to location |
| Testing instructions per requirement | ☐ | Step-by-step guide |
| Test credentials provided | ☐ | Admin + member accounts |
| 21st.dev/ReactBits components listed | ☐ | With locations |
| Edge Functions documented | ☐ | Names + descriptions |
| MCP servers documented | ☐ | Which ones + how to test |
| 3+ RAG chatbot example questions | ☐ | Questions that work well |

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

### Critical (Must Have for Submission)
1. ☑ **Add user roles** - `is_admin` column + admin nav + user management page
2. ☑ **Editable profile page** - Avatar, display name, bio, timezone with validation
3. ☑ **Document 4 UI components** - 7 ReactBits components identified and documented
4. ☑ **Deploy to Netlify** - https://flowstateos.netlify.app/
5. ☐ **Write one-page PDF** - Testing guide document

### Important (Strong Submission)
6. ☐ **Fix RAG LLM integration** - Switch from rule-based to actual LLM (OpenAI/Claude)
7. ☐ **Store chat history** - Save conversations to database
8. ☑ **Role-based UI** - Admin nav section + User Management page
9. ☐ **Schema diagram** - Visual for write-up

### Nice to Have
10. ☐ **Revisit semantic search fine-tuning** - Improve match quality
11. ☐ **Additional MCP integrations** - Show more MCP value

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
| 1. Auth & Roles | Sign up → Log in → Check role-based UI → Log out |
| 2. Profile | Settings → Edit name/bio → Save → Refresh → Verify |
| 3. Database | Create project → Create idea → Verify in dashboard |
| 4. UI Components | [List locations of 4 components] |
| 5. Edge Functions | Ask FlowState question → Triggers embedding + search |
| 6. MCP | Used Supabase MCP, Magic MCP, ReactBits MCP in development |
| 7. RAG Chatbot | Click AI button → Ask "How many projects do I have?" |

### RAG Chatbot Example Questions
1. "How many ideas do I have?"
2. "What projects am I working on?"
3. "What tasks are linked to my rap song project?"

---

**Document Version:** 1.2
**Last Updated:** February 5, 2026
**Status:** In Progress (4/5 Critical Items Complete)
**Live URL:** https://flowstateos.netlify.app/
