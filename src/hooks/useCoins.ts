import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DailyTask {
  id: string;
  name: string;
  description: string;
  reward_coins: number;
  task_type: string;
  required_count: number;
}

export interface TaskProgress {
  id: string;
  task_id: string;
  current_count: number;
  is_completed: boolean;
  is_claimed: boolean;
}

export function useCoins(userId: string | undefined) {
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, TaskProgress>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchCoinsAndTasks();
    }
  }, [userId]);

  const fetchCoinsAndTasks = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch or create user coins
      let { data: coinsData } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!coinsData) {
        const { data: newCoins } = await supabase
          .from("user_coins")
          .insert({ user_id: userId, balance: 100 }) // Start with 100 coins
          .select()
          .single();
        coinsData = newCoins;
      }

      setBalance(coinsData?.balance || 0);

      // Fetch daily tasks
      const { data: tasksData } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("is_active", true);

      setTasks(tasksData || []);

      // Fetch today's progress
      const today = new Date().toISOString().split("T")[0];
      const { data: progressData } = await supabase
        .from("user_task_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("reset_date", today);

      const progressMap: Record<string, TaskProgress> = {};
      progressData?.forEach((p) => {
        progressMap[p.task_id] = p;
      });

      setTaskProgress(progressMap);
    } catch (error) {
      console.error("Error fetching coins data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCoins = async (amount: number, type: string, description: string) => {
    if (!userId) return;

    try {
      // Update balance
      const { error: updateError } = await supabase
        .from("user_coins")
        .update({ 
          balance: balance + amount,
          total_earned: balance + amount
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from("coin_transactions").insert({
        user_id: userId,
        amount,
        transaction_type: type,
        description,
      });

      setBalance((prev) => prev + amount);
      
      toast({
        title: `+${amount} Coins!`,
        description,
      });
    } catch (error) {
      console.error("Error adding coins:", error);
    }
  };

  const updateTaskProgress = async (taskType: string, increment: number = 1) => {
    if (!userId) return;

    const task = tasks.find((t) => t.task_type === taskType);
    if (!task) return;

    const today = new Date().toISOString().split("T")[0];
    const progress = taskProgress[task.id];

    if (progress?.is_claimed) return; // Already claimed today

    try {
      const newCount = (progress?.current_count || 0) + increment;
      const isCompleted = newCount >= task.required_count;

      if (progress) {
        await supabase
          .from("user_task_progress")
          .update({ current_count: newCount, is_completed: isCompleted })
          .eq("id", progress.id);
      } else {
        const { data: newProgress } = await supabase.from("user_task_progress").insert({
          user_id: userId,
          task_id: task.id,
          current_count: newCount,
          is_completed: isCompleted,
          reset_date: today,
        }).select().single();

        if (newProgress) {
          setTaskProgress((prev) => ({
            ...prev,
            [task.id]: {
              id: newProgress.id,
              task_id: task.id,
              current_count: newCount,
              is_completed: isCompleted,
              is_claimed: false,
            },
          }));
          return;
        }
      }

      setTaskProgress((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          id: progress?.id || "",
          task_id: task.id,
          current_count: newCount,
          is_completed: isCompleted,
          is_claimed: progress?.is_claimed || false,
        },
      }));
    } catch (error) {
      console.error("Error updating task progress:", error);
    }
  };

  const claimTaskReward = async (taskId: string) => {
    if (!userId) return;

    const task = tasks.find((t) => t.id === taskId);
    const progress = taskProgress[taskId];

    if (!task || !progress?.is_completed || progress.is_claimed) return;

    try {
      await supabase
        .from("user_task_progress")
        .update({ is_claimed: true })
        .eq("id", progress.id);

      await addCoins(task.reward_coins, "daily_task", `Completed: ${task.name}`);

      setTaskProgress((prev) => ({
        ...prev,
        [taskId]: { ...prev[taskId], is_claimed: true },
      }));
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  return {
    balance,
    tasks,
    taskProgress,
    loading,
    addCoins,
    updateTaskProgress,
    claimTaskReward,
    refetch: fetchCoinsAndTasks,
  };
}
