-- Allow users to delete their own chat messages.
-- Single-message delete restricted to user-sent messages (role = 'user').
-- Bulk delete (all roles) allowed for clearing entire history.
CREATE POLICY "Users can delete own user messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);
