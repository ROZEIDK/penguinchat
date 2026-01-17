-- Add second character fields to chatbots table
ALTER TABLE public.chatbots 
ADD COLUMN has_second_character BOOLEAN DEFAULT false,
ADD COLUMN second_character_type TEXT DEFAULT NULL, -- 'inline' or 'linked'
ADD COLUMN second_character_name TEXT DEFAULT NULL,
ADD COLUMN second_character_description TEXT DEFAULT NULL,
ADD COLUMN second_character_backstory TEXT DEFAULT NULL,
ADD COLUMN second_character_dialogue_style TEXT DEFAULT NULL,
ADD COLUMN second_character_avatar_url TEXT DEFAULT NULL,
ADD COLUMN second_character_gender TEXT DEFAULT NULL,
ADD COLUMN linked_chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE SET NULL DEFAULT NULL;

-- Add index for linked chatbot lookups
CREATE INDEX idx_chatbots_linked_chatbot_id ON public.chatbots(linked_chatbot_id);