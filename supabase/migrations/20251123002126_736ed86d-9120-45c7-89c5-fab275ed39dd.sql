-- Backfill missing profiles for existing users
INSERT INTO profiles (id, username, show_mature_content)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  false
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Ensure the trigger exists for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();