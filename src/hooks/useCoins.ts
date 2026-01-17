import { useState, useEffect, useRef, useCallback } from "react";
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

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  weekly_bonus_last_claimed: string | null;
}

const WEEKLY_BONUS_COINS = 100;

export function useCoins(userId: string | undefined) {
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, TaskProgress>>({});
  const [streak, setStreak] = useState<UserStreak>({ 
    current_streak: 0, 
    longest_streak: 0, 
    last_completed_date: null,
    weekly_bonus_last_claimed: null 
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Refs to track latest state for callbacks
  const tasksRef = useRef<DailyTask[]>([]);
  const taskProgressRef = useRef<Record<string, TaskProgress>>({});
  const balanceRef = useRef(0);
  const userIdRef = useRef<string | undefined>(userId);
  
  // Keep refs in sync
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  useEffect(() => {
    taskProgressRef.current = taskProgress;
  }, [taskProgress]);
  
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

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

      // Fetch or create streak data
      let { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!streakData) {
        const { data: newStreak } = await supabase
          .from("user_streaks")
          .insert({ user_id: userId })
          .select()
          .single();
        streakData = newStreak;
      }

      if (streakData) {
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          last_completed_date: streakData.last_completed_date,
          weekly_bonus_last_claimed: streakData.weekly_bonus_last_claimed,
        });
      }
    } catch (error) {
      console.error("Error fetching coins data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCoins = useCallback(async (amount: number, type: string, description: string) => {
    const currentUserId = userIdRef.current;
    const currentBalance = balanceRef.current;
    
    if (!currentUserId) return;

    try {
      // Update balance
      const { error: updateError } = await supabase
        .from("user_coins")
        .update({ 
          balance: currentBalance + amount,
          total_earned: currentBalance + amount
        })
        .eq("user_id", currentUserId);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from("coin_transactions").insert({
        user_id: currentUserId,
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
  }, [toast]);

  const checkAndUpdateStreak = useCallback(async (currentUserId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch all active tasks
      const { data: allTasks } = await supabase
        .from("daily_tasks")
        .select("id")
        .eq("is_active", true);

      if (!allTasks || allTasks.length === 0) return;

      // Fetch today's progress for all tasks
      const { data: todayProgress } = await supabase
        .from("user_task_progress")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("reset_date", today);

      // Check if ALL tasks are completed AND claimed
      const completedTaskIds = new Set(
        todayProgress?.filter(p => p.is_completed && p.is_claimed).map(p => p.task_id) || []
      );
      const allTasksCompleted = allTasks.every(t => completedTaskIds.has(t.id));

      if (!allTasksCompleted) return;

      // Fetch current streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", currentUserId)
        .single();

      if (!streakData) return;

      // Already updated today
      if (streakData.last_completed_date === today) return;

      // Calculate new streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (streakData.last_completed_date === yesterdayStr) {
        // Consecutive day
        newStreak = streakData.current_streak + 1;
      }

      const newLongest = Math.max(newStreak, streakData.longest_streak);

      // Update streak
      await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_completed_date: today,
        })
        .eq("user_id", currentUserId);

      setStreak(prev => ({
        ...prev,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completed_date: today,
      }));

      toast({
        title: `🔥 ${newStreak} Day Streak!`,
        description: "You completed all daily tasks!",
      });

      // Check for weekly bonus (every 7 days)
      if (newStreak > 0 && newStreak % 7 === 0) {
        // Check if we haven't already claimed this week's bonus
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStartStr = weekStart.toISOString().split("T")[0];
        
        if (!streakData.weekly_bonus_last_claimed || streakData.weekly_bonus_last_claimed < weekStartStr) {
          // Award weekly bonus
          const { data: coinsData } = await supabase
            .from("user_coins")
            .select("balance, total_earned")
            .eq("user_id", currentUserId)
            .single();

          const currentBalance = coinsData?.balance || 0;
          const totalEarned = coinsData?.total_earned || 0;

          await supabase
            .from("user_coins")
            .update({
              balance: currentBalance + WEEKLY_BONUS_COINS,
              total_earned: totalEarned + WEEKLY_BONUS_COINS,
            })
            .eq("user_id", currentUserId);

          await supabase.from("coin_transactions").insert({
            user_id: currentUserId,
            amount: WEEKLY_BONUS_COINS,
            transaction_type: "weekly_bonus",
            description: `7-day streak bonus!`,
          });

          await supabase
            .from("user_streaks")
            .update({ weekly_bonus_last_claimed: today })
            .eq("user_id", currentUserId);

          setBalance(prev => prev + WEEKLY_BONUS_COINS);
          setStreak(prev => ({ ...prev, weekly_bonus_last_claimed: today }));

          toast({
            title: `🎊 +${WEEKLY_BONUS_COINS} Weekly Bonus!`,
            description: `Amazing! You've maintained a ${newStreak}-day streak!`,
          });
        }
      }
    } catch (error) {
      console.error("Error checking streak:", error);
    }
  }, [toast]);

  const autoClaimReward = useCallback(async (
    taskData: DailyTask, 
    progressId: string,
    currentUserId: string
  ) => {
    try {
      // Mark as claimed
      await supabase
        .from("user_task_progress")
        .update({ is_claimed: true })
        .eq("id", progressId);

      // Get current balance from database to avoid race conditions
      const { data: coinsData } = await supabase
        .from("user_coins")
        .select("balance, total_earned")
        .eq("user_id", currentUserId)
        .single();

      const currentBalance = coinsData?.balance || 0;
      const totalEarned = coinsData?.total_earned || 0;

      // Update balance
      await supabase
        .from("user_coins")
        .update({ 
          balance: currentBalance + taskData.reward_coins,
          total_earned: totalEarned + taskData.reward_coins
        })
        .eq("user_id", currentUserId);

      // Log transaction
      await supabase.from("coin_transactions").insert({
        user_id: currentUserId,
        amount: taskData.reward_coins,
        transaction_type: "daily_task",
        description: `Completed: ${taskData.name}`,
      });

      setBalance((prev) => prev + taskData.reward_coins);
      
      setTaskProgress((prev) => ({
        ...prev,
        [taskData.id]: { ...prev[taskData.id], is_claimed: true },
      }));

      toast({
        title: `🎉 +${taskData.reward_coins} Coins!`,
        description: `Task completed: ${taskData.name}`,
      });

      // Check if all tasks are now complete for streak
      await checkAndUpdateStreak(currentUserId);
    } catch (error) {
      console.error("Error auto-claiming reward:", error);
    }
  }, [toast, checkAndUpdateStreak]);

  const updateTaskProgress = useCallback(async (taskType: string, increment: number = 1) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    try {
      // Fetch ALL tasks with this task type (not just one!)
      const { data: tasksData } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("task_type", taskType)
        .eq("is_active", true);

      if (!tasksData || tasksData.length === 0) {
        console.log(`No active task found for type: ${taskType}`);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Update progress for ALL tasks with this task type
      for (const taskData of tasksData) {
        // Fetch current progress from database for this specific task
        const { data: existingProgress } = await supabase
          .from("user_task_progress")
          .select("*")
          .eq("user_id", currentUserId)
          .eq("task_id", taskData.id)
          .eq("reset_date", today)
          .single();

        if (existingProgress?.is_claimed) continue; // Already claimed today, skip to next task

        const newCount = (existingProgress?.current_count || 0) + increment;
        const isCompleted = newCount >= taskData.required_count;
        const wasAlreadyCompleted = existingProgress?.is_completed || false;

        if (existingProgress) {
          await supabase
            .from("user_task_progress")
            .update({ current_count: newCount, is_completed: isCompleted })
            .eq("id", existingProgress.id);
            
          setTaskProgress((prev) => ({
            ...prev,
            [taskData.id]: {
              ...prev[taskData.id],
              id: existingProgress.id,
              task_id: taskData.id,
              current_count: newCount,
              is_completed: isCompleted,
              is_claimed: existingProgress.is_claimed,
            },
          }));

          // Auto-claim if just completed
          if (isCompleted && !wasAlreadyCompleted) {
            await autoClaimReward(taskData, existingProgress.id, currentUserId);
          }
        } else {
          const { data: newProgress } = await supabase.from("user_task_progress").insert({
            user_id: currentUserId,
            task_id: taskData.id,
            current_count: newCount,
            is_completed: isCompleted,
            reset_date: today,
          }).select().single();

          if (newProgress) {
            setTaskProgress((prev) => ({
              ...prev,
              [taskData.id]: {
                id: newProgress.id,
                task_id: taskData.id,
                current_count: newCount,
                is_completed: isCompleted,
                is_claimed: false,
              },
            }));

            // Auto-claim if completed on first progress
            if (isCompleted) {
              await autoClaimReward(taskData, newProgress.id, currentUserId);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating task progress:", error);
    }
  }, [autoClaimReward]);

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
    streak,
    loading,
    addCoins,
    updateTaskProgress,
    claimTaskReward,
    refetch: fetchCoinsAndTasks,
  };
}
