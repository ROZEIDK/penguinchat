-- Update the check constraint to allow 'dall-e' as a valid image generation model
ALTER TABLE chatbots DROP CONSTRAINT IF EXISTS chatbots_image_generation_model_check;

ALTER TABLE chatbots ADD CONSTRAINT chatbots_image_generation_model_check 
CHECK (image_generation_model IN ('gemini', 'dall-e'));