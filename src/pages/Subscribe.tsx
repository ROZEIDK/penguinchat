import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap, Coins, Users, ImageIcon, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCoins } from "@/hooks/useCoins";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Subscribe() {
  const [userId, setUserId] = useState<string | undefined>();
  const { isPremium, purchasing, purchasePremium, PREMIUM_COST, loading: subLoading } = useSubscription();
  const { balance, loading: coinsLoading } = useCoins(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  const loading = subLoading || coinsLoading;

  const premiumFeatures = [
    {
      icon: Zap,
      title: "2x Coin Earnings",
      description: "Earn double coins from all daily tasks and activities",
    },
    {
      icon: Users,
      title: "Dual Character Mode",
      description: "Create chatbots with two characters that both respond to you",
    },
    {
      icon: ImageIcon,
      title: "Stable Diffusion Access",
      description: "Use Stable Diffusion for high-quality image generation in your chats",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-3">Premium Membership</h1>
          <p className="text-muted-foreground">
            Unlock exclusive features with a one-time coin purchase
          </p>
        </div>

        {/* Current Status */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-card to-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">{balance.toLocaleString()} Coins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full font-semibold ${
                isPremium 
                  ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {isPremium ? "✨ Premium Member" : "Free Member"}
              </div>
            </div>
          </div>
        </Card>

        {isPremium ? (
          /* Already Premium */
          <Card className="p-8 text-center border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">You're a Premium Member!</h2>
            <p className="text-muted-foreground mb-6">
              You have access to all premium features. Thank you for your support!
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {premiumFeatures.map((feature) => (
                <div key={feature.title} className="p-4 rounded-xl bg-card border border-border">
                  <feature.icon className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          /* Premium Offer */
          <Card className="p-8 border-primary/50 bg-gradient-to-br from-primary/10 to-accent/5">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">One-Time Purchase</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">
                <span className="text-primary">{PREMIUM_COST}</span> Coins
              </h2>
              <p className="text-muted-foreground">
                Unlock all premium features forever
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {premiumFeatures.map((feature) => (
                <div 
                  key={feature.title} 
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 w-fit mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* All Benefits */}
            <div className="bg-card rounded-xl p-6 mb-8 border border-border">
              <h3 className="font-semibold mb-4">All Premium Benefits</h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {[
                  "2x coins on all daily tasks",
                  "Access to dual character chatbots",
                  "Stable Diffusion image generation",
                  "Premium member badge",
                  "Early access to new features",
                  "Priority support",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={balance < PREMIUM_COST || purchasing}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : balance < PREMIUM_COST ? (
                    `Need ${PREMIUM_COST - balance} more coins`
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Purchase Premium for {PREMIUM_COST} Coins
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Premium Purchase</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to spend <strong>{PREMIUM_COST} coins</strong> to unlock Premium membership forever. 
                    This will give you 2x coin earnings, dual character mode access, and Stable Diffusion image generation.
                    <br /><br />
                    Your balance after purchase: <strong>{balance - PREMIUM_COST} coins</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={purchasePremium} disabled={purchasing}>
                    {purchasing ? "Processing..." : "Confirm Purchase"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {balance < PREMIUM_COST && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Complete daily tasks to earn more coins!
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
