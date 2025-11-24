import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateChatbot() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gender: "",
    intro_message: "",
    is_public: true,
    is_mature: false,
    backstory: "",
    dialogue_style: "",
    avatar_url: "",
    image_generation_model: "gemini",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("app-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("app-assets")
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: data.publicUrl });
      toast({ title: "Avatar uploaded successfully!" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("chatbots").insert({
        ...formData,
        tags,
        creator_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Chatbot created successfully!" });
      navigate("/");
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
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Create Character
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
            <Label htmlFor="avatar" className="block mb-2">
              Avatar
            </Label>
            <div className="flex items-center gap-4">
              {formData.avatar_url ? (
                <div className="relative w-32 h-32">
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2"
                    onClick={() => setFormData({ ...formData, avatar_url: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </label>
              )}
            </div>
          </div>

          <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card space-y-4">
            <div>
              <Label htmlFor="image_model">Image Generation Model</Label>
              <Select
                value={formData.image_generation_model}
                onValueChange={(value) =>
                  setFormData({ ...formData, image_generation_model: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini (Default)</SelectItem>
                  <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="intro_message">First Message *</Label>
              <Textarea
                id="intro_message"
                value={formData.intro_message}
                onChange={(e) =>
                  setFormData({ ...formData, intro_message: e.target.value })
                }
                required
                className="mt-1"
                rows={2}
                placeholder="What the chatbot says when someone starts a conversation"
              />
            </div>

            <div>
              <Label htmlFor="backstory">Background Story</Label>
              <Textarea
                id="backstory"
                value={formData.backstory}
                onChange={(e) =>
                  setFormData({ ...formData, backstory: e.target.value })
                }
                className="mt-1"
                rows={3}
                placeholder="How you and the chatbot met"
              />
            </div>

            <div>
              <Label htmlFor="dialogue_style">Dialogue Style</Label>
              <Input
                id="dialogue_style"
                value={formData.dialogue_style}
                onChange={(e) =>
                  setFormData({ ...formData, dialogue_style: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Formal, Casual, Poetic"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (up to 5)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  disabled={tags.length >= 5}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={addTag} disabled={tags.length >= 5}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_public">Make Public</Label>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_mature">Mature Content</Label>
              <Switch
                id="is_mature"
                checked={formData.is_mature}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_mature: checked })
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Chatbot"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
