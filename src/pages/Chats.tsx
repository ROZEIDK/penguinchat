import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  chatbot_id: string;
  last_message_at: string;
  chatbots: {
    name: string;
    avatar_url: string | null;
  } | null;
  last_message_content?: string;
}

interface SearchResult {
  conversation_id: string;
  chatbot_id: string;
  chatbot_name: string;
  chatbot_avatar: string | null;
  message_content: string;
  message_date: string;
}

export default function Chats() {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
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

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && user) {
        searchMessages(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, user]);

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

  const searchMessages = async (query: string) => {
    if (!user) return;
    setSearching(true);

    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        conversation_id,
        conversations!inner (
          id,
          chatbot_id,
          user_id,
          chatbots (
            name,
            avatar_url
          )
        )
      `)
      .eq("conversations.user_id", user.id)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const results: SearchResult[] = data.map((msg: any) => ({
        conversation_id: msg.conversation_id,
        chatbot_id: msg.conversations.chatbot_id,
        chatbot_name: msg.conversations.chatbots?.name || "Unknown",
        chatbot_avatar: msg.conversations.chatbots?.avatar_url || null,
        message_content: msg.content,
        message_date: msg.created_at,
      }));
      setSearchResults(results);
    }
    setSearching(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Your Chats
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search your chat history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
            {searchResults.length === 0 && !searching ? (
              <p className="text-muted-foreground text-center py-8">
                No messages found matching "{searchQuery}"
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result, idx) => (
                  <Card
                    key={`${result.conversation_id}-${idx}`}
                    onClick={() => navigate(`/chat/${result.chatbot_id}`)}
                    className="p-4 bg-gradient-card border-border hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {result.chatbot_avatar ? (
                        <img
                          src={result.chatbot_avatar}
                          alt={result.chatbot_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <span className="text-lg font-bold text-primary-foreground">
                            {result.chatbot_name[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{result.chatbot_name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(result.message_date), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {highlightMatch(result.message_content, searchQuery)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        {!showSearchResults && (
          <>
            {conversations.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  You haven't started any conversations yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => {
                  if (!conv.chatbots) return null;
                  
                  return (
                    <Card
                      key={conv.id}
                      onClick={() => navigate(`/chat/${conv.chatbot_id}`)}
                      className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {conv.chatbots.avatar_url ? (
                          <img
                            src={conv.chatbots.avatar_url}
                            alt={conv.chatbots.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-foreground">
                              {conv.chatbots.name[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-1">{conv.chatbots.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last active{" "}
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
