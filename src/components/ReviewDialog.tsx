import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { Loader2 } from "lucide-react";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
  chatbotName: string;
  userId: string;
  onReviewSubmitted: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  chatbotId,
  chatbotName,
  userId,
  onReviewSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId && chatbotId) {
      fetchExistingReview();
    }
  }, [open, userId, chatbotId]);

  const fetchExistingReview = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setExistingReview(data);
      setRating(data.rating);
      setReviewText(data.review_text || "");
    } else {
      setExistingReview(null);
      setRating(0);
      setReviewText("");
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating,
            review_text: reviewText || null,
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast({ title: "Review updated!" });
      } else {
        const { error } = await supabase.from("reviews").insert({
          chatbot_id: chatbotId,
          user_id: userId,
          rating,
          review_text: reviewText || null,
        });

        if (error) throw error;
        toast({ title: "Review submitted!" });
      }

      onReviewSubmitted();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Update your review" : "Rate"} {chatbotName}
          </DialogTitle>
          <DialogDescription>
            Share your experience with this chatbot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Your rating</span>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>

          <Textarea
            placeholder="Write your review (optional)..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
          />

          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : existingReview ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
