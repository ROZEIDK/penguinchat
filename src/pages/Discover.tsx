import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogIn } from "lucide-react";
import { ChatbotCard } from "@/components/ChatbotCard";
import { useToast } from "@/hooks/use-toast";
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

interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  tags: string[];
  total_views: number;
  creator_id: string;
  is_mature: boolean;
  average_rating?: number;
  review_count?: number;
}

export default function Discover() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      }
    );

    fetchChatbots();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("show_mature_content")
      .eq("id", userId)
      .single();
    
    if (data) {
      setUserProfile(data);
    }
  };

  const fetchChatbots = async () => {
    // Fetch chatbots
    const { data: chatbotsData, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error || !chatbotsData) return;

    // Fetch reviews to calculate average ratings
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("chatbot_id, rating");

    // Calculate average ratings per chatbot
    const ratingsByBot: Record<string, { sum: number; count: number }> = {};
    reviewsData?.forEach((r) => {
      if (!ratingsByBot[r.chatbot_id]) {
        ratingsByBot[r.chatbot_id] = { sum: 0, count: 0 };
      }
      ratingsByBot[r.chatbot_id].sum += r.rating;
      ratingsByBot[r.chatbot_id].count += 1;
    });

    const chatbotsWithRatings = chatbotsData.map((bot) => ({
      ...bot,
      average_rating: ratingsByBot[bot.id]
        ? ratingsByBot[bot.id].sum / ratingsByBot[bot.id].count
        : 0,
      review_count: ratingsByBot[bot.id]?.count || 0,
    }));

    setChatbots(chatbotsWithRatings);
  };

  const filteredChatbots = chatbots.filter((bot) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const showMature = userProfile?.show_mature_content ?? false;
    const matchesMatureFilter = !bot.is_mature || showMature;
    
    return matchesSearch && matchesMatureFilter;
  });

  const handleDeleteRequest = (chatbotId: string) => {
    setChatbotToDelete(chatbotId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!chatbotToDelete) return;

    try {
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", chatbotToDelete);

      if (error) throw error;

      toast({ title: "Chatbot deleted successfully!" });
      fetchChatbots(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setChatbotToDelete(null);
    }
  };

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
              <ChatbotCard 
                key={bot.id} 
                chatbot={bot} 
                currentUserId={user?.id}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chatbot? This action cannot be undone.
              All conversations with this chatbot will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
