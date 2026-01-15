import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCoins } from "@/hooks/useCoins";
import { Upload, Loader2, X, Eye, EyeOff, MessageCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

export default function CreateChatbot() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [privateCharacters, setPrivateCharacters] = useState<Tables<"chatbots">[]>([]);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateTaskProgress } = useCoins(user?.id);

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

  const fetchPrivateCharacters = async () => {
    if (!user) return;
    setLoadingPrivate(true);
    try {
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("creator_id", user.id)
        .eq("is_public", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrivateCharacters(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading private characters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPrivate(false);
    }
  };

  useEffect(() => {
    if (showPrivate && user) {
      fetchPrivateCharacters();
    }
  }, [showPrivate, user]);

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

      // Track character creation for coins
      updateTaskProgress("create_character", 1);

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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create Character
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/help?tab=creating")}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Creation Guide</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPrivate(!showPrivate)}
              className="flex items-center gap-2"
            >
              {showPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPrivate ? "Hide" : "Show"} Private Characters
            </Button>
          </div>
        </div>

        {showPrivate && (
          <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Private Characters</h2>
            {loadingPrivate ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : privateCharacters.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                You don't have any private characters yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {privateCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {character.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{character.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {character.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/chat/${character.id}`)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                  <SelectItem value="gemini">DreamForge (Default)</SelectItem>
                  <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                  <SelectItem value="gpt-image">GPT Image</SelectItem>
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
