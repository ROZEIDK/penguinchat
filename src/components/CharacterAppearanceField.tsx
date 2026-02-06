import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CharacterAppearanceFieldProps {
  value: string;
  onChange: (value: string) => void;
  characterName: string;
  characterDescription: string;
  characterGender: string;
}

export default function CharacterAppearanceField({
  value,
  onChange,
  characterName,
  characterDescription,
  characterGender,
}: CharacterAppearanceFieldProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateAppearance = async () => {
    if (!characterName && !characterDescription) {
      toast({
        title: "Missing character info",
        description: "Please provide a name or description first so AI can generate an appearance.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-appearance", {
        body: {
          characterName,
          characterDescription,
          characterGender,
        },
      });

      if (error) throw error;

      if (data?.appearance) {
        onChange(data.appearance);
        toast({ title: "Appearance generated!" });
      } else {
        throw new Error("No appearance generated");
      }
    } catch (error: any) {
      console.error("Generate appearance error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate appearance description",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2 p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <Label htmlFor="character_appearance">Character Appearance (for Stable Diffusion)</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateAppearance}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Describe what your character looks like. This helps Stable Diffusion generate consistent images.
      </p>
      <Textarea
        id="character_appearance"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., A young woman with long silver hair, bright blue eyes, wearing a black leather jacket and red scarf. She has pale skin, a gentle smile, and delicate features."
        rows={3}
        className="mt-1"
      />
    </div>
  );
}
