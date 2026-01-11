import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "100 messages per day",
      "Basic character creation",
      "Standard response speed",
      "Community support",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    icon: Sparkles,
    features: [
      "Unlimited messages",
      "Priority response speed",
      "Advanced character creation",
      "Image generation (50/day)",
      "No ads",
      "Custom themes",
    ],
    popular: true,
  },
  {
    name: "Ultimate",
    price: "$19.99",
    period: "per month",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Unlimited image generation",
      "Early access to features",
      "Exclusive characters",
      "API access",
      "Priority support",
    ],
  },
];

export default function Subscribe() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Unlock premium features and enhance your experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-6 ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                {plan.icon && (
                  <plan.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                )}
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.current
                    ? "bg-secondary text-secondary-foreground"
                    : plan.popular
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
