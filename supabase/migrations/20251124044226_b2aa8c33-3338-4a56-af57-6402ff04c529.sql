-- Add image generation model field to chatbots table
ALTER TABLE public.chatbots 
ADD COLUMN image_generation_model TEXT DEFAULT 'gemini' CHECK (image_generation_model IN ('gemini', 'stable-diffusion'));