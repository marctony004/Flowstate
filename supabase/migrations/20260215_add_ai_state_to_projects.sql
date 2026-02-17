-- 8A.4: Add AI-detected project state column
-- Stores semantic state detection results as JSONB

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS ai_state JSONB DEFAULT NULL;

COMMENT ON COLUMN public.projects.ai_state IS 'AI-detected project state: { state, confidence, explanation, detectedAt, overriddenBy }';
