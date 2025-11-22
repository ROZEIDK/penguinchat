import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogIn } from "lucide-react";
import { ChatbotCard } from "@/components/ChatbotCard";

interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  tags: string[];
  total_views: number;
  creator_id: string;
}

export default function Discover() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    fetchChatbots();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchChatbots = async () => {
    const { data, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChatbots(data);
    }
  };

  const filteredChatbots = chatbots.filter((bot) =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search chatbots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
          {!user && (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90 transition-opacity h-12 px-6"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Login
            </Button>
          )}
        </div>

        {filteredChatbots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              No chatbots have been made. Make your own!
            </p>
            {user && (
              <Button
                onClick={() => navigate("/create")}
                className="mt-4 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Create Character
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChatbots.map((bot) => (
              <ChatbotCard key={bot.id} chatbot={bot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
