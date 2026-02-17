-- 8A.5: Add sentiment analysis columns to collaborator_notes
ALTER TABLE public.collaborator_notes
  ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sentiment_status TEXT DEFAULT 'pending';
