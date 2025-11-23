-- Add is_mature column to chatbots table
ALTER TABLE chatbots ADD COLUMN is_mature boolean DEFAULT false;

-- Add show_mature_content column to profiles table
ALTER TABLE profiles ADD COLUMN show_mature_content boolean DEFAULT false;