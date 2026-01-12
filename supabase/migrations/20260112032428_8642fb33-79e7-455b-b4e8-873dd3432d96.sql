-- Add is_archived column to conversations
ALTER TABLE public.conversations ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Allow users to delete messages in their own conversations
CREATE POLICY "Users can delete messages in their conversations"
ON public.messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = auth.uid()
));