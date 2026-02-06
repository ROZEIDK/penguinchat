-- Add character appearance description field for Stable Diffusion image generation
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS character_appearance TEXT;