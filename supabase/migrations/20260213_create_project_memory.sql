-- Create project_memory table for persisting user interaction patterns
CREATE TABLE IF NOT EXISTS public.project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_weights JSONB NOT NULL DEFAULT '{}',
  attention_patterns JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for fast lookup by user
CREATE INDEX idx_project_memory_user ON public.project_memory (user_id);

-- Enable RLS
ALTER TABLE public.project_memory ENABLE ROW LEVEL SECURITY;

-- Users can read their own memory
CREATE POLICY "Users can view own project memory"
  ON public.project_memory
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own memory
CREATE POLICY "Users can insert own project memory"
  ON public.project_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own memory
CREATE POLICY "Users can update own project memory"
  ON public.project_memory
  FOR UPDATE
  USING (auth.uid() = user_id);
