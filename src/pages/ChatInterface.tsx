import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, ArrowLeft } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
            onClick={() => navigate("/chats")}
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
          <div>
            <h2 className="font-bold text-lg">{chatbot.name}</h2>
            <p className="text-sm text-muted-foreground">
              {chatbot.description}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
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
              <div
                className={`px-4 py-3 rounded-2xl max-w-[70%] ${
                  msg.role === "user"
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-card/80 backdrop-blur-lg border border-border"
                }`}
              >
                {msg.content}
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
    </div>
  );
}
