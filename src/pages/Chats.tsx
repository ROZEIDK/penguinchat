import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  chatbot_id: string;
  last_message_at: string;
  chatbot: {
    name: string;
    avatar_url: string | null;
  };
}

export default function Chats() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchConversations(session.user.id);
      }
    });
  }, [navigate]);

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        chatbot_id,
        last_message_at,
        chatbots (
          name,
          avatar_url
        )
      `
      )
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    if (!error && data) {
      setConversations(data as any);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Your Chats
        </h1>

        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              You haven't started any conversations yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.chatbot_id}`)}
                className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {conv.chatbot.avatar_url ? (
                    <img
                      src={conv.chatbot.avatar_url}
                      alt={conv.chatbot.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {conv.chatbot.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">{conv.chatbot.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last active{" "}
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                      })}
                    </p>
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
