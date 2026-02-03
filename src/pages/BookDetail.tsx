import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  ArrowLeft, 
  Eye, 
  Star, 
  MessageSquare, 
  User,
  Calendar,
  FileText,
  Link2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Book {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  cover_url: string | null;
  pdf_url: string | null;
  creator_id: string;
  total_views: number;
  tags: string[];
  created_at: string;
}

interface LinkedChatbot {
  id: string;
  name: string;
  avatar_url: string | null;
  description: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function BookDetail() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [creator, setCreator] = useState<any>(null);
  const [linkedChatbots, setLinkedChatbots] = useState<LinkedChatbot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchLinkedChatbots();
      fetchReviews();
      fetchComments();
      recordView();
    }
  }, [bookId]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (error || !data) {
      toast({ title: "Book not found", variant: "destructive" });
      navigate("/");
      return;
    }

    setBook(data);
    
    // Fetch creator
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.creator_id)
      .single();
    
    setCreator(profile);
    setLoading(false);
  };

  const fetchLinkedChatbots = async () => {
    const { data: links } = await supabase
      .from("book_chatbot_links")
      .select("chatbot_id")
      .eq("book_id", bookId);

    if (links && links.length > 0) {
      const chatbotIds = links.map((l) => l.chatbot_id);
      const { data: chatbots } = await supabase
        .from("chatbots")
        .select("id, name, avatar_url, description")
        .in("id", chatbotIds);
      
      if (chatbots) {
        setLinkedChatbots(chatbots);
      }
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("book_reviews")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      
      const reviewsWithProfiles = data.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id),
      }));
      
      setReviews(reviewsWithProfiles);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("book_comments")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      
      const commentsWithProfiles = data.map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id),
      }));
      
      setComments(commentsWithProfiles);
    }
  };

  const recordView = async () => {
    // Increment views directly
    if (book) {
      await supabase
        .from("books")
        .update({ total_views: (book.total_views || 0) + 1 })
        .eq("id", bookId);
    }
  };

  const submitReview = async () => {
    if (!user || userRating === 0) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("book_reviews")
        .upsert({
          book_id: bookId,
          user_id: user.id,
          rating: userRating,
          review_text: userReview || null,
        });

      if (error) throw error;
      
      toast({ title: "Review submitted!" });
      setUserRating(0);
      setUserReview("");
      fetchReviews();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("book_comments")
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;
      
      toast({ title: "Comment added!" });
      setNewComment("");
      fetchComments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Book Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover */}
          <div className="w-48 h-64 flex-shrink-0 mx-auto md:mx-0">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500/40 to-orange-600/40 rounded-xl flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-amber-200/80" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Book
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            
            {creator && (
              <Link 
                to={`/user/${creator.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback>{creator.username?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">by {creator.username}</span>
              </Link>
            )}

            {book.description && (
              <p className="text-muted-foreground mb-4">{book.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{book.total_views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{averageRating.toFixed(1)} ({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(book.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded bg-secondary text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Linked Characters */}
        {linkedChatbots.length > 0 && (
          <div className="bg-gradient-card rounded-xl p-6 border border-border mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Linked Characters</h2>
            </div>
            <div className="grid gap-3">
              {linkedChatbots.map((chatbot) => (
                <Link
                  key={chatbot.id}
                  to={`/chatbot/${chatbot.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  {chatbot.avatar_url ? (
                    <img
                      src={chatbot.avatar_url}
                      alt={chatbot.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chatbot.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{chatbot.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="read" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="read" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Read
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="read">
            <div className="bg-gradient-card rounded-xl p-6 border border-border">
              {book.pdf_url ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">This book is available as a PDF</p>
                  <Button asChild className="bg-amber-500 hover:bg-amber-600">
                    <a href={book.pdf_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Open PDF
                    </a>
                  </Button>
                </div>
              ) : book.content ? (
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap font-serif">
                    {book.content}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center">No content available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-gradient-card rounded-xl p-6 border border-border">
              {user && (
                <div className="mb-6 pb-6 border-b border-border">
                  <h3 className="font-semibold mb-3">Leave a Review</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">Your rating:</span>
                    <StarRating rating={userRating} onRatingChange={setUserRating} interactive />
                  </div>
                  <Textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Write your review (optional)"
                    rows={3}
                    className="mb-3"
                  />
                  <Button onClick={submitReview} disabled={submitting || userRating === 0}>
                    Submit Review
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.profile?.avatar_url || ""} />
                          <AvatarFallback>{review.profile?.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{review.profile?.username || "Anonymous"}</p>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <div className="bg-gradient-card rounded-xl p-6 border border-border">
              {user && (
                <div className="mb-6 pb-6 border-b border-border">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="mb-3"
                  />
                  <Button onClick={submitComment} disabled={submitting || !newComment.trim()}>
                    Post Comment
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-4 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profile?.avatar_url || ""} />
                          <AvatarFallback>{comment.profile?.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm flex-1">{comment.profile?.username || "Anonymous"}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
