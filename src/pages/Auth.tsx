import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const trackLoginTask = async (userId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Get login task
      const { data: loginTask } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("task_type", "login")
        .eq("is_active", true)
        .single();

      if (!loginTask) return;

      // Check if already logged in today
      const { data: existingProgress } = await supabase
        .from("user_task_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("task_id", loginTask.id)
        .eq("reset_date", today)
        .single();

      if (existingProgress) return; // Already tracked

      // Create progress for today
      await supabase.from("user_task_progress").insert({
        user_id: userId,
        task_id: loginTask.id,
        current_count: 1,
        is_completed: true,
        reset_date: today,
      });

      // Ensure user has coins record
      const { data: coinsData } = await supabase
        .from("user_coins")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!coinsData) {
        await supabase.from("user_coins").insert({
          user_id: userId,
          balance: 100, // Starting balance
        });
      }
    } catch (error) {
      console.error("Error tracking login:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Track daily login
        if (data.user) {
          await trackLoginTask(data.user.id);
        }
        
        toast({ title: "Welcome back!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username },
          },
        });
        if (error) throw error;
        toast({ title: "Account created! Check your email to verify." });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-gradient-card rounded-2xl shadow-card p-8 border border-border">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Penguin Chat
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
