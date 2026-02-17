-- Session logs for 8A.3: Personal Creative Memory / Session Recall
-- Captures key user events with embeddings for semantic retrieval

CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_session_logs_user_created ON public.session_logs (user_id, created_at DESC);
CREATE INDEX idx_session_logs_user_project ON public.session_logs (user_id, project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_session_logs_event_type ON public.session_logs (user_id, event_type);

-- Enable RLS
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "Users can view own session logs"
  ON public.session_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own session logs"
  ON public.session_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role full access to session logs"
  ON public.session_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
