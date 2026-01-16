import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCoins } from "@/hooks/useCoins";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Gift, CheckCircle2, Clock, Sparkles, Flame, Trophy } from "lucide-react";

export default function CoinsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const { balance, tasks, taskProgress, streak, loading, claimTaskReward } = useCoins(user?.id);

  // Calculate how many tasks are completed today
  const completedTasks = tasks.filter(task => taskProgress[task.id]?.is_claimed).length;
  const totalTasks = tasks.length;
  const allTasksCompleted = completedTasks === totalTasks && totalTasks > 0;

  // Calculate days until next weekly bonus
  const daysUntilBonus = streak.current_streak > 0 ? 7 - (streak.current_streak % 7) : 7;

  if (!user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Coins className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to earn coins!</h2>
          <p className="text-muted-foreground">
            Login to start earning coins by chatting and completing daily tasks.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Balance Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <Coins className="h-10 w-10 text-yellow-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Your Balance</p>
              <h1 className="text-4xl font-bold text-yellow-500">{balance.toLocaleString()}</h1>
            </div>
          </div>
        </Card>

        {/* Streak Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500/20 rounded-full">
                <Flame className="h-10 w-10 text-orange-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Daily Streak</p>
                <h2 className="text-3xl font-bold text-orange-500">{streak.current_streak} Days</h2>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Trophy className="h-4 w-4" />
                <span>Best: {streak.longest_streak} days</span>
              </div>
              {streak.current_streak > 0 && daysUntilBonus < 7 && (
                <p className="text-sm text-orange-400">
                  {daysUntilBonus === 0 ? "🎉 Bonus earned!" : `${daysUntilBonus} day${daysUntilBonus !== 1 ? 's' : ''} to 100 coin bonus!`}
                </p>
              )}
            </div>
          </div>
          
          {/* Streak Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Weekly Progress</span>
              <span>{streak.current_streak % 7}/7 days</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    i < (streak.current_streak % 7) || (streak.current_streak > 0 && streak.current_streak % 7 === 0 && i < 7)
                      ? "bg-orange-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete all daily tasks to maintain your streak!
            </p>
          </div>
        </Card>

        {/* Today's Progress Summary */}
        <Card className={`p-4 mb-6 ${allTasksCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-secondary/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allTasksCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold">
                  {allTasksCompleted ? "All tasks completed! 🎉" : "Today's Progress"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {completedTasks}/{totalTasks} tasks completed
                </p>
              </div>
            </div>
            <Progress value={(completedTasks / Math.max(totalTasks, 1)) * 100} className="w-24 h-2" />
          </div>
        </Card>

        {/* Daily Tasks */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Daily Tasks</h2>
            <span className="text-xs text-muted-foreground ml-2">Resets at midnight</span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 h-24 bg-muted" />
                ))}
              </div>
            ) : (
              tasks.map((task) => {
                const progress = taskProgress[task.id];
                const progressPercent = Math.min(
                  ((progress?.current_count || 0) / task.required_count) * 100,
                  100
                );
                const isCompleted = progress?.is_completed;
                const isClaimed = progress?.is_claimed;

                return (
                  <Card
                    key={task.id}
                    className={`p-4 transition-all ${
                      isClaimed
                        ? "bg-muted/50 opacity-60"
                        : isCompleted
                        ? "border-yellow-500/50 bg-yellow-500/5"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isClaimed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : isCompleted ? (
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold">{task.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <Progress value={progressPercent} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {progress?.current_count || 0}/{task.required_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Coins className="h-4 w-4" />
                          <span className="font-bold">+{task.reward_coins}</span>
                        </div>
                        {isCompleted && !isClaimed && (
                          <Button
                            size="sm"
                            onClick={() => claimTaskReward(task.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            Claim
                          </Button>
                        )}
                        {isClaimed && (
                          <span className="text-xs text-green-500">Claimed!</span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-secondary/50">
          <h3 className="font-semibold mb-2">How to earn coins</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Complete daily tasks to earn bonus coins</li>
            <li>• Chat with characters to earn coins per message</li>
            <li>• Create characters to earn 50 coins</li>
            <li>• Login daily for 5 bonus coins</li>
            <li className="text-orange-400">• 🔥 Maintain a 7-day streak for 100 bonus coins!</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
