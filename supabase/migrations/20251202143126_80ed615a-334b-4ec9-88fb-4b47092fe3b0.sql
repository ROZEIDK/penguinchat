-- Drop the old constraint
ALTER TABLE chatbots DROP CONSTRAINT IF EXISTS chatbots_image_generation_model_check;

-- Add the new constraint with all allowed values
ALTER TABLE chatbots ADD CONSTRAINT chatbots_image_generation_model_check 
CHECK (image_generation_model = ANY (ARRAY['gemini', 'dall-e', 'stable-diffusion', 'gpt-image']));