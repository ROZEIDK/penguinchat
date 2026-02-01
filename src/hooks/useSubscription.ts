import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PREMIUM_COST = 500;

interface Subscription {
  id: string;
  user_id: string;
  is_premium: boolean;
  purchased_at: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const purchasePremium = async (): Promise<boolean> => {
    setPurchasing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Not logged in",
          description: "Please log in to purchase premium.",
          variant: "destructive",
        });
        return false;
      }

      // Check current coin balance
      const { data: coinsData, error: coinsError } = await supabase
        .from("user_coins")
        .select("balance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (coinsError) throw coinsError;

      const currentBalance = coinsData?.balance || 0;
      if (currentBalance < PREMIUM_COST) {
        toast({
          title: "Insufficient coins",
          description: `You need ${PREMIUM_COST} coins to purchase premium. You have ${currentBalance} coins.`,
          variant: "destructive",
        });
        return false;
      }

      // Deduct coins
      const { error: deductError } = await supabase
        .from("user_coins")
        .update({ balance: currentBalance - PREMIUM_COST })
        .eq("user_id", session.user.id);

      if (deductError) throw deductError;

      // Record transaction
      await supabase.from("coin_transactions").insert({
        user_id: session.user.id,
        amount: -PREMIUM_COST,
        transaction_type: "purchase",
        description: "Premium subscription purchase",
      });

      // Create or update subscription
      const { data: existingSub } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from("user_subscriptions")
          .update({
            is_premium: true,
            purchased_at: new Date().toISOString(),
          })
          .eq("user_id", session.user.id);
      } else {
        await supabase.from("user_subscriptions").insert({
          user_id: session.user.id,
          is_premium: true,
          purchased_at: new Date().toISOString(),
        });
      }

      toast({
        title: "Welcome to Premium! 🎉",
        description: "You now have access to all premium features!",
      });

      await fetchSubscription();
      return true;
    } catch (error) {
      console.error("Error purchasing premium:", error);
      toast({
        title: "Purchase failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => authSub.unsubscribe();
  }, []);

  return {
    subscription,
    isPremium: subscription?.is_premium || false,
    loading,
    purchasing,
    purchasePremium,
    refreshSubscription: fetchSubscription,
    PREMIUM_COST,
  };
}
