import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface ReviewsListProps {
  chatbotId: string;
  refreshKey?: number;
}

export function ReviewsList({ chatbotId, refreshKey }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    fetchReviews();
  }, [chatbotId, refreshKey]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        created_at,
        user_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq("chatbot_id", chatbotId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data as any);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No reviews yet. Be the first to review!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating rating={Math.round(averageRating)} size="sm" />
        <span className="text-sm text-muted-foreground">
          {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-3 rounded-lg bg-card/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              {review.profiles?.avatar_url ? (
                <img
                  src={review.profiles.avatar_url}
                  alt={review.profiles.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {review.profiles?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">
                {review.profiles?.username || "Anonymous"}
              </span>
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
            {review.review_text && (
              <p className="text-sm text-muted-foreground">{review.review_text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
