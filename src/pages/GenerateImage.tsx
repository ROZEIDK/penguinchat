import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2 } from "lucide-react";

export default function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Placeholder - would integrate with actual image generation API
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedImage("https://images.unsplash.com/photo-1518770660439-4636190af475?w=512&h=512&fit=crop");
    }, 2000);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Generate Image</h1>

        <Card className="p-6 mb-6">
          <Textarea
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] mb-4"
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </Card>

        {generatedImage && (
          <Card className="p-4">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full rounded-lg"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
