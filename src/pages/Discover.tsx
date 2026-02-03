import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogIn, Star, User as UserIcon, Camera, Coins, Menu, TrendingUp, Eye, BookOpen } from "lucide-react";
import { ChatbotCard } from "@/components/ChatbotCard";
import { BookCard } from "@/components/BookCard";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  gender: string | null;
  average_rating?: number;
  review_count?: number;
  has_second_character?: boolean;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  total_views: number;
  creator_id: string;
  tags: string[];
  average_rating?: number;
  review_count?: number;
}

const genderFilters = [
  { label: "All", value: "all", icon: Star },
  { label: "Male", value: "male", icon: UserIcon },
  { label: "Female", value: "female", icon: UserIcon },
  { label: "Non-binary", value: "non-binary", icon: UserIcon },
];

const categoryTags = [
  "Recommend",
  "Books",
  "Anime",
  "Dominant",
  "OC",
  "Mafia",
  "Yandere",
  "Furry",
  "Femboy",
  "Horror",
  "Romance",
  "Fantasy",
  "Sci-Fi",
];

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return views.toString();
}

function getBookTags(book: Book): string[] {
  return book.tags || [];
}

export default function Discover() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [trendingBots, setTrendingBots] = useState<Chatbot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("Recommend");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchCoinBalance(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
          fetchCoinBalance(session.user.id);
        }
      }
    );

    fetchChatbots();
    fetchBooks();
    fetchTrendingBots();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("show_mature_content, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const fetchCoinBalance = async (userId: string) => {
    const { data } = await supabase
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (data) {
      setCoinBalance(data.balance);
    }
  };

  const fetchChatbots = async () => {
    const { data: chatbotsData, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error || !chatbotsData) return;

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("chatbot_id, rating");

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

  const fetchBooks = async () => {
    const { data: booksData, error } = await supabase
      .from("books")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error || !booksData) return;

    const { data: reviewsData } = await supabase
      .from("book_reviews")
      .select("book_id, rating");

    const ratingsByBook: Record<string, { sum: number; count: number }> = {};
    (reviewsData as any[] || []).forEach((r: any) => {
      if (!ratingsByBook[r.book_id]) {
        ratingsByBook[r.book_id] = { sum: 0, count: 0 };
      }
      ratingsByBook[r.book_id].sum += r.rating;
      ratingsByBook[r.book_id].count += 1;
    });

    const booksWithRatings = (booksData as any[]).map((book: any) => ({
      id: book.id as string,
      title: book.title as string,
      description: book.description as string | null,
      cover_url: book.cover_url as string | null,
      total_views: (book.total_views || 0) as number,
      creator_id: book.creator_id as string,
      tags: (book.tags || []) as string[],
      average_rating: ratingsByBook[book.id]
        ? ratingsByBook[book.id].sum / ratingsByBook[book.id].count
        : 0,
      review_count: ratingsByBook[book.id]?.count || 0,
    })) as Book[];

    setBooks(booksWithRatings);
  };

  const fetchTrendingBots = async () => {
    // Get top 3 chatbots by views (simulating "this week" by just using total_views)
    const { data, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("is_public", true)
      .order("total_views", { ascending: false })
      .limit(3);

    if (!error && data) {
      setTrendingBots(data);
    }
  };

  const isBookFilter = categoryFilter === "Books";

  const filteredChatbots = chatbots.filter((bot) => {
    if (isBookFilter) return false; // Don't show chatbots when Books filter is active
    
    const matchesSearch =
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const showMature = userProfile?.show_mature_content ?? false;
    const matchesMatureFilter = !bot.is_mature || showMature;

    const matchesGender =
      genderFilter === "all" ||
      bot.gender?.toLowerCase() === genderFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === "Recommend" ||
      bot.tags.some(
        (tag) => tag.toLowerCase() === categoryFilter.toLowerCase()
      );

    return matchesSearch && matchesMatureFilter && matchesGender && matchesCategory;
  });

  const filteredBooks: Book[] = [];
  for (const book of books) {
    if (!isBookFilter && categoryFilter !== "Recommend") continue;
    
    const tagsArray: string[] = getBookTags(book);
    const searchLower = searchQuery.toLowerCase();
    const categoryLower = categoryFilter.toLowerCase();
    
    const matchesSearch =
      book.title.toLowerCase().includes(searchLower) ||
      (book.description?.toLowerCase().includes(searchLower) ?? false) ||
      tagsArray.some((t) => t.toLowerCase().includes(searchLower));

    const matchesCategory =
      categoryFilter === "Recommend" ||
      categoryFilter === "Books" ||
      tagsArray.some((t) => t.toLowerCase() === categoryLower);

    if (matchesSearch && matchesCategory) {
      filteredBooks.push(book);
    }
  }

  const handleDeleteRequest = (chatbotId: string) => {
    setChatbotToDelete(chatbotId);
    setDeleteDialogOpen(true);
  };

  const handleBookDeleteRequest = (bookId: string) => {
    setBookToDelete(bookId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (chatbotToDelete) {
      try {
        const { error } = await supabase
          .from("chatbots")
          .delete()
          .eq("id", chatbotToDelete);

        if (error) throw error;

        toast({ title: "Chatbot deleted successfully!" });
        fetchChatbots();
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
    } else if (bookToDelete) {
      try {
        const { error } = await supabase
          .from("books")
          .delete()
          .eq("id", bookToDelete);

        if (error) throw error;

        toast({ title: "Book deleted successfully!" });
        fetchBooks();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setBookToDelete(null);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Characters"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-secondary border-0 rounded-full text-sm"
            />
          </div>
          
          {/* Right side icons */}
          {user ? (
            <>
              {/* Coins */}
              <button 
                onClick={() => navigate("/coins")}
                className="flex items-center gap-1 bg-secondary/80 px-2.5 py-1.5 rounded-full"
              >
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{coinBalance}</span>
              </button>
              
              {/* Camera/Generate */}
              <button 
                onClick={() => navigate("/generate-image")}
                className="p-2 rounded-full bg-secondary/80"
              >
                <Camera className="h-5 w-5 text-muted-foreground" />
              </button>
              
              {/* Profile Avatar */}
              <button onClick={() => navigate("/profile")}>
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              className="bg-primary hover:bg-primary/90 rounded-full"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 hidden md:block">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Characters"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-secondary border-0 rounded-full text-sm"
            />
          </div>
          {!user && (
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              className="bg-primary hover:bg-primary/90 rounded-full"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Mobile Trending Section */}
        {trendingBots.length > 0 && (
          <div className="md:hidden mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Trending This Week</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {trendingBots.map((bot, index) => (
                <Link
                  key={bot.id}
                  to={`/chatbot/${bot.id}`}
                  className="shrink-0 w-32 group"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                    {bot.avatar_url ? (
                      <img
                        src={bot.avatar_url}
                        alt={bot.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                        <span className="text-2xl font-bold">{bot.name[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      #{index + 1}
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <p className="text-white text-xs font-medium truncate">{bot.name}</p>
                      <div className="flex items-center gap-1 text-white/70 text-[10px]">
                        <Eye className="h-2.5 w-2.5" />
                        <span>{formatViews(bot.total_views)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Category Tabs - Horizontal scroll like reference */}
        <div className="md:hidden mb-4">
          {/* Gender + Categories row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Gender filter */}
            <button
              onClick={() => setGenderFilter(genderFilter === "all" ? "female" : genderFilter === "female" ? "male" : "all")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50 text-muted-foreground whitespace-nowrap"
            >
              <Star className="h-4 w-4" />
              <span className="text-sm">Gender</span>
            </button>
            
            {/* Category tabs */}
            {categoryTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setCategoryFilter(tag)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  categoryFilter === tag
                    ? "text-primary border-b-2 border-primary bg-transparent"
                    : "text-muted-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
            
            {/* Filter menu */}
            <button className="p-2 rounded-lg bg-secondary/50 ml-auto shrink-0">
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:block mb-6">
          {/* Trending This Week */}
          {trendingBots.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Trending This Week</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {trendingBots.map((bot, index) => (
                  <Link
                    key={bot.id}
                    to={`/chatbot/${bot.id}`}
                    className="group relative rounded-xl overflow-hidden bg-card hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {bot.avatar_url ? (
                        <img
                          src={bot.avatar_url}
                          alt={bot.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary-foreground/80">
                            {bot.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Rank badge */}
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">
                        #{index + 1}
                      </div>
                      
                      {/* Views */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs bg-black/40 px-2 py-1 rounded">
                        <Eye className="h-3 w-3" />
                        <span>{formatViews(bot.total_views)}</span>
                      </div>
                      
                      {/* Name overlay */}
                      <div className="absolute bottom-2 left-2 right-14">
                        <h3 className="font-semibold text-white truncate">{bot.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Banner Promo Area */}
          <div className="mb-6 rounded-xl overflow-hidden bg-gradient-to-r from-purple-600/40 to-blue-600/40 p-6 relative">
            <div className="relative z-10">
              <p className="text-yellow-400 text-sm font-medium mb-1">
                Nano Banana Pro 🍌
              </p>
              <h2 className="text-2xl font-bold mb-1">Remix Iconic Comics Your Way</h2>
              <p className="text-sm text-muted-foreground mb-4">
                New upgrade, more free tries
              </p>
              <Button className="bg-cyan-400/80 hover:bg-cyan-400 text-black font-semibold rounded-full px-6">
                GO
              </Button>
            </div>
          </div>

          {/* For You Section */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">For you</h2>
              {/* Gender Filters */}
              <div className="flex items-center gap-2">
                {genderFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setGenderFilter(filter.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                      genderFilter === filter.value
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter.value === "all" ? (
                      <Star className="h-3.5 w-3.5" />
                    ) : filter.value === "male" ? (
                      <span className="text-blue-400">♂</span>
                    ) : filter.value === "female" ? (
                      <span className="text-pink-400">♀</span>
                    ) : (
                      <span>⚧</span>
                    )}
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Tags */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categoryTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setCategoryFilter(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                    categoryFilter === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {filteredChatbots.length === 0 && filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              {isBookFilter ? "No books found. Publish your own!" : "No chatbots found. Create your own!"}
            </p>
            {user && (
              <Button
                onClick={() => navigate(isBookFilter ? "/create-book" : "/create")}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                {isBookFilter ? "Publish Book" : "Create Character"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                currentUserId={user?.id}
                onDelete={handleBookDeleteRequest}
              />
            ))}
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
            <AlertDialogTitle>{bookToDelete ? "Delete Book" : "Delete Chatbot"}</AlertDialogTitle>
            <AlertDialogDescription>
              {bookToDelete 
                ? "Are you sure you want to delete this book? This action cannot be undone."
                : "Are you sure you want to delete this chatbot? This action cannot be undone. All conversations with this chatbot will be deleted."}
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
