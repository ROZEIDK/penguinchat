import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCoins } from "@/hooks/useCoins";
import { Send, Loader2, ArrowLeft, Edit, Trash2, ImagePlus, Star, RotateCcw, Archive, MoreVertical } from "lucide-react";
import { ReviewDialog } from "@/components/ReviewDialog";
import { ReviewsList } from "@/components/ReviewsList";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Chatbot {
  id: string;
  name: string;
  avatar_url: string | null;
  intro_message: string;
  backstory: string | null;
  dialogue_style: string | null;
  description: string;
  creator_id: string;
  is_mature: boolean | null;
  image_generation_model: string | null;
  tags: string[] | null;
}

export default function ChatInterface() {
  const { chatbotId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Coins hook for tracking chat progress
  const { updateTaskProgress } = useCoins(user?.id);

  const isOwner = user && chatbot && user.id === chatbot.creator_id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        initializeChat(session.user.id);
      }
    });
  }, [chatbotId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async (userId: string) => {
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

      // Record view
      await supabase.from("chatbot_views").insert({
        chatbot_id: chatbotId,
        viewer_id: userId,
      });

      await supabase
        .from("chatbots")
        .update({ total_views: (chatbotData.total_views || 0) + 1 })
        .eq("id", chatbotId);

      // Find or create conversation
      let { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("chatbot_id", chatbotId)
        .maybeSingle();

      if (!convData) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            chatbot_id: chatbotId,
          })
          .select()
          .single();

        if (convError) throw convError;
        convData = newConv;
        
        // Track unique chat for coins (new conversation with a different chatbot)
        updateTaskProgress("unique_chats", 1);

        // Add intro message
        const { data: introMsg } = await supabase
          .from("messages")
          .insert({
            conversation_id: convData.id,
            role: "assistant",
            content: chatbotData.intro_message,
          })
          .select()
          .single();

        setMessages([introMsg as Message]);
      } else {
        // Unarchive if archived
        if (convData.is_archived) {
          await supabase
            .from("conversations")
            .update({ is_archived: false })
            .eq("id", convData.id);
        }

        // Load existing messages
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convData.id)
          .order("created_at", { ascending: true });

        setMessages((msgs || []) as Message[]);
      }

      setConversation(convData);
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

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    try {
      // Save user message
      const { data: userMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      setMessages((prev) => [...prev, userMsg as Message]);

      // Track chat progress for coins
      updateTaskProgress("chat_count", 1);

      // Call AI
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [...messages, userMsg],
          chatbot,
        },
      });

      if (error) throw error;

      // Save AI response
      const { data: aiMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: data.response,
        })
        .select()
        .single();

      setMessages((prev) => [...prev, aiMsg as Message]);

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChatbot = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", chatbotId);

      if (error) throw error;

      toast({ title: "Chatbot deleted successfully!" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleResetChat = async () => {
    if (!conversation || !chatbot) return;
    setDeleting(true);

    try {
      // Delete all messages
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversation.id);

      // Re-add intro message
      const { data: introMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: chatbot.intro_message,
        })
        .select()
        .single();

      setMessages([introMsg as Message]);
      toast({ title: "Chat reset to start!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowResetDialog(false);
    }
  };

  const handleArchiveChat = async () => {
    if (!conversation) return;

    try {
      await supabase
        .from("conversations")
        .update({ is_archived: true })
        .eq("id", conversation.id);

      toast({ title: "Chat archived", description: "You can find it in the Archived tab" });
      navigate("/chats");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setShowArchiveDialog(false);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await supabase
        .from("messages")
        .delete()
        .eq("id", selectedMessage.id);

      setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
      toast({ title: "Message deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteMessageDialog(false);
      setSelectedMessage(null);
    }
  };

  const confirmDeleteMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setShowDeleteMessageDialog(true);
  };

  // Format message content with italics for *actions*
  const formatMessage = (content: string) => {
    if (content.startsWith("data:image/") || content.startsWith("http")) {
      return <img src={content} alt="Generated" className="max-w-full rounded-lg" />;
    }

    // Split by asterisk patterns and format
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="text-muted-foreground block mb-1">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatbot) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: chatbot.avatar_url
          ? `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${chatbot.avatar_url})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/chats");
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {chatbot.avatar_url ? (
            <img
              src={chatbot.avatar_url}
              alt={chatbot.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                {chatbot.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg">{chatbot.name}</h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {chatbot.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowReviews(!showReviews)}
              title="View reviews"
            >
              <Star className="h-4 w-4" />
            </Button>
            {!isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewDialog(true)}
              >
                Rate
              </Button>
            )}
            
            {/* Chat Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Chat
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/edit/${chatbotId}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Chatbot
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Chatbot
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reviews Panel */}
        {showReviews && (
          <div className="border-t border-border p-4 bg-card/60">
            <ReviewsList chatbotId={chatbotId!} refreshKey={reviewRefreshKey} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 group ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && chatbot.avatar_url && (
                <img
                  src={chatbot.avatar_url}
                  alt={chatbot.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div className="flex items-start gap-2">
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[70%] ${
                    msg.role === "user"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-card/80 backdrop-blur-lg border border-border"
                  }`}
                >
                  {formatMessage(msg.content)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => confirmDeleteMessage(msg)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              {chatbot.avatar_url && (
                <img
                  src={chatbot.avatar_url}
                  alt={chatbot.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div className="px-4 py-3 rounded-2xl bg-card/80 backdrop-blur-lg border border-border">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card/80 backdrop-blur-lg border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInput("Give me a picture of ")}
            title="Generate image"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Delete Chatbot Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chatbot.name}"? This action cannot be undone.
              All conversations with this chatbot will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChatbot}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Chat Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Chat</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all messages and start fresh with {chatbot.name}'s intro message.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetChat} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Chat Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Chat</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive your conversation with {chatbot.name}. 
              You can restore it anytime from the Archived tab in your chats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveChat}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Dialog */}
      <AlertDialog open={showDeleteMessageDialog} onOpenChange={setShowDeleteMessageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      {user && chatbot && (
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          chatbotId={chatbot.id}
          chatbotName={chatbot.name}
          userId={user.id}
          onReviewSubmitted={() => setReviewRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
