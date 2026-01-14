import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Eye, ArrowLeft, Star, User } from "lucide-react";
import { ChatbotCard } from "@/components/ChatbotCard";

interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  tags: string[];
  total_views: number;
  creator_id: string;
  gender: string | null;
  intro_message: string;
  backstory: string | null;
  is_mature: boolean;
}

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function ChatbotDetail() {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const navigate = useNavigate();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [otherBots, setOtherBots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    if (chatbotId) {
      fetchChatbotDetails();
    }
  }, [chatbotId]);

  const fetchChatbotDetails = async () => {
    setLoading(true);
    try {
      // Fetch chatbot
      const { data: chatbotData, error: chatbotError } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (chatbotError) throw chatbotError;
      setChatbot(chatbotData);

      // Fetch reviews for rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("chatbot_id", chatbotId);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setAverageRating(avg);
        setReviewCount(reviews.length);
      }

      // Fetch creator
      const { data: creatorData, error: creatorError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .eq("id", chatbotData.creator_id)
        .single();

      if (!creatorError && creatorData) {
        setCreator(creatorData);

        // Fetch other bots by the same creator
        const { data: otherBotsData } = await supabase
          .from("chatbots")
          .select("*")
          .eq("creator_id", chatbotData.creator_id)
          .eq("is_public", true)
          .neq("id", chatbotId)
          .limit(6);

        if (otherBotsData) {
          setOtherBots(otherBotsData);
        }
      }
    } catch (error) {
      console.error("Error fetching chatbot details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Chatbot not found</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg truncate">{chatbot.name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Main Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="shrink-0 mx-auto md:mx-0">
            {chatbot.avatar_url ? (
              <img
                src={chatbot.avatar_url}
                alt={chatbot.name}
                className="w-48 h-64 md:w-56 md:h-72 object-cover rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-48 h-64 md:w-56 md:h-72 rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary-foreground/80">
                  {chatbot.name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{chatbot.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{chatbot.total_views.toLocaleString()} views</span>
                </div>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{averageRating.toFixed(1)} ({reviewCount} reviews)</span>
                  </div>
                )}
                {chatbot.gender && (
                  <Badge variant="secondary">{chatbot.gender}</Badge>
                )}
                {chatbot.is_mature && (
                  <Badge variant="destructive">18+</Badge>
                )}
              </div>
            </div>

            {/* Tags */}
            {chatbot.tags && chatbot.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chatbot.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {chatbot.description}
              </p>
            </div>

            {/* Backstory if available */}
            {chatbot.backstory && (
              <div>
                <h3 className="font-semibold mb-2">Backstory</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {chatbot.backstory}
                </p>
              </div>
            )}

            {/* Chat Button */}
            <Button
              onClick={() => navigate(`/chat/${chatbot.id}`)}
              className="w-full md:w-auto bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Start Chatting
            </Button>
          </div>
        </div>

        {/* Creator Section */}
        {creator && (
          <div className="bg-card rounded-xl border border-border p-4 mb-8">
            <h3 className="font-semibold mb-3">Created by</h3>
            <Link
              to={`/user/${creator.id}`}
              className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={creator.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {creator.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{creator.username}</p>
                {creator.bio && (
                  <p className="text-sm text-muted-foreground truncate">{creator.bio}</p>
                )}
              </div>
              <User className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        )}

        {/* Other Bots by Creator */}
        {otherBots.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">More by {creator?.username}</h3>
              <Link
                to={`/user/${creator?.id}`}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {otherBots.map((bot) => (
                <ChatbotCard key={bot.id} chatbot={bot} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
