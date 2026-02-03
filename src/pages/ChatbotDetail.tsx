import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Eye, ArrowLeft, Star, User, BookOpen } from "lucide-react";
import { ChatbotCard } from "@/components/ChatbotCard";
import { CommentsSection } from "@/components/CommentsSection";

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

interface LinkedBook {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
}

export default function ChatbotDetail() {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const navigate = useNavigate();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [otherBots, setOtherBots] = useState<Chatbot[]>([]);
  const [linkedBooks, setLinkedBooks] = useState<LinkedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    if (chatbotId) {
      fetchChatbotDetails();
      fetchLinkedBooks();
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

  const fetchLinkedBooks = async () => {
    try {
      const { data: links } = await supabase
        .from("book_chatbot_links")
        .select("book_id")
        .eq("chatbot_id", chatbotId);

      if (links && links.length > 0) {
        const bookIds = links.map((l: any) => l.book_id);
        const { data: books } = await supabase
          .from("books")
          .select("id, title, description, cover_url")
          .in("id", bookIds);
        
        if (books) {
          setLinkedBooks(books as LinkedBook[]);
        }
      }
    } catch (error) {
      console.error("Error fetching linked books:", error);
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
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
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

            {/* Linked Books Section */}
            {linkedBooks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  Linked Books
                </h3>
                <div className="space-y-2">
                  {linkedBooks.map((book) => (
                    <Link
                      key={book.id}
                      to={`/book/${book.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-amber-500/20 rounded flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{book.title}</p>
                        {book.description && (
                          <p className="text-xs text-muted-foreground truncate">{book.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
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

        {/* Comments Section */}
        <div className="mb-8">
          <CommentsSection chatbotId={chatbot.id} />
        </div>

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
