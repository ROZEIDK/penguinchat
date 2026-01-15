import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, Archive, ArchiveRestore, Trash2, MoreVertical, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Conversation {
  id: string;
  chatbot_id: string;
  last_message_at: string;
  is_archived: boolean;
  chatbots: {
    name: string;
    avatar_url: string | null;
  } | null;
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
  const [activeTab, setActiveTab] = useState("active");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      .select(`
        id,
        chatbot_id,
        last_message_at,
        is_archived,
        chatbots (
          name,
          avatar_url
        )
      `)
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

  const toggleArchive = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const newArchiveState = !conv.is_archived;
    
    const { error } = await supabase
      .from("conversations")
      .update({ is_archived: newArchiveState })
      .eq("id", conv.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: newArchiveState ? "Chat archived" : "Chat restored",
        description: newArchiveState 
          ? "You can find it in the Archived tab" 
          : "Chat is now active again"
      });
      fetchConversations(user.id);
    }
  };

  const confirmDelete = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedConversation(conv);
    setDeleteDialogOpen(true);
  };

  const deleteConversation = async () => {
    if (!selectedConversation) return;

    // Delete all messages first
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", selectedConversation.id);

    // Delete conversation
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", selectedConversation.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Chat deleted permanently" });
      fetchConversations(user.id);
    }
    
    setDeleteDialogOpen(false);
    setSelectedConversation(null);
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
  const activeConversations = conversations.filter(c => !c.is_archived);
  const archivedConversations = conversations.filter(c => c.is_archived);

  const renderConversationCard = (conv: Conversation) => {
    if (!conv.chatbots) return null;

    return (
      <Card
        key={conv.id}
        onClick={() => navigate(`/chat/${conv.chatbot_id}`)}
        className="p-4 bg-gradient-card border-border hover:border-primary/50 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          {conv.chatbots.avatar_url ? (
            <img
              src={conv.chatbots.avatar_url}
              alt={conv.chatbots.name}
              className="w-14 h-14 rounded-lg object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                {conv.chatbots.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{conv.chatbots.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => toggleArchive(conv, e)}>
                {conv.is_archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore Chat
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Chat
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => confirmDelete(conv, e)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Your Chats
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/help?tab=messaging")}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat Tips</span>
          </Button>
        </div>

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

        {/* Conversations Tabs */}
        {!showSearchResults && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-card">
              <TabsTrigger value="active" className="gap-2">
                Active
                {activeConversations.length > 0 && (
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                    {activeConversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-2">
                <Archive className="h-4 w-4" />
                Archived
                {archivedConversations.length > 0 && (
                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                    {archivedConversations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeConversations.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">
                    No active conversations yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeConversations.map(renderConversationCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived">
              {archivedConversations.length === 0 ? (
                <div className="text-center py-16">
                  <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">
                    No archived chats
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Archived chats will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedConversations.map(renderConversationCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation with{" "}
              {selectedConversation?.chatbots?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
