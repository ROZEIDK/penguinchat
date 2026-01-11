-- Create user_coins table to track user coin balance
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- Policies for user_coins
CREATE POLICY "Users can view their own coins"
ON public.user_coins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coins record"
ON public.user_coins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins"
ON public.user_coins FOR UPDATE
USING (auth.uid() = user_id);

-- Create daily_tasks table
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_coins INTEGER NOT NULL DEFAULT 10,
  task_type TEXT NOT NULL, -- 'chat_count', 'login', 'create_character', etc.
  required_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tasks
CREATE POLICY "Anyone can view active tasks"
ON public.daily_tasks FOR SELECT
USING (is_active = true);

-- Create user_task_progress table
CREATE TABLE public.user_task_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, reset_date)
);

-- Enable RLS
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_task_progress
CREATE POLICY "Users can view their own task progress"
ON public.user_task_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task progress"
ON public.user_task_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task progress"
ON public.user_task_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create coin_transactions table for history
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'daily_task', 'chat_reward'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for coin_transactions
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.coin_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on user_coins
CREATE TRIGGER update_user_coins_updated_at
BEFORE UPDATE ON public.user_coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on user_task_progress
CREATE TRIGGER update_user_task_progress_updated_at
BEFORE UPDATE ON public.user_task_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default daily tasks
INSERT INTO public.daily_tasks (name, description, reward_coins, task_type, required_count) VALUES
('Daily Login', 'Log in to the app', 5, 'login', 1),
('Chat Starter', 'Send 5 messages to any character', 10, 'chat_count', 5),
('Active Chatter', 'Send 20 messages to characters', 25, 'chat_count', 20),
('Character Creator', 'Create a new character', 50, 'create_character', 1),
('Explorer', 'Chat with 3 different characters', 15, 'unique_chats', 3);