import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Eye, TrendingUp } from "lucide-react";

interface ChatbotStats {
  id: string;
  name: string;
  avatar_url: string | null;
  total_views: number;
  monthly_views: number;
}

export default function Notifications() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ChatbotStats[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchStats(session.user.id);
      }
    });
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    const { data: chatbots } = await supabase
      .from("chatbots")
      .select("id, name, avatar_url, total_views")
      .eq("creator_id", userId);

    if (chatbots) {
      const statsWithMonthly = await Promise.all(
        chatbots.map(async (bot) => {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          const { count } = await supabase
            .from("chatbot_views")
            .select("*", { count: "exact", head: true })
            .eq("chatbot_id", bot.id)
            .gte("viewed_at", oneMonthAgo.toISOString());

          return {
            ...bot,
            monthly_views: count || 0,
          };
        })
      );

      setStats(statsWithMonthly);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Notifications
        </h1>

        {stats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              You haven't created any chatbots yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((bot) => (
              <Card
                key={bot.id}
                className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  {bot.avatar_url ? (
                    <img
                      src={bot.avatar_url}
                      alt={bot.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {bot.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">{bot.name}</h3>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{bot.total_views} total views</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          {bot.monthly_views} views this month
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
