import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Upload, Loader2, X, ArrowLeft, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SecondCharacterForm from "@/components/SecondCharacterForm";
import CharacterAppearanceField from "@/components/CharacterAppearanceField";

export default function EditChatbot() {
  const { chatbotId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = useSubscription();

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
    character_appearance: "",
  });

  const [secondCharacterData, setSecondCharacterData] = useState({
    has_second_character: false,
    second_character_type: null as "inline" | "linked" | null,
    second_character_name: "",
    second_character_description: "",
    second_character_backstory: "",
    second_character_dialogue_style: "",
    second_character_avatar_url: "",
    second_character_gender: "",
    linked_chatbot_id: "",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchChatbot(session.user.id);
      }
    });
  }, [navigate, chatbotId]);

  const fetchChatbot = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (error) throw error;

      // Check if user is the owner
      if (data.creator_id !== userId) {
        toast({
          title: "Access denied",
          description: "You can only edit your own chatbots",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setFormData({
        name: data.name || "",
        description: data.description || "",
        gender: data.gender || "",
        intro_message: data.intro_message || "",
        is_public: data.is_public ?? true,
        is_mature: data.is_mature ?? false,
        backstory: data.backstory || "",
        dialogue_style: data.dialogue_style || "",
        avatar_url: data.avatar_url || "",
        image_generation_model: data.image_generation_model || "gemini",
        character_appearance: data.character_appearance || "",
      });

      setSecondCharacterData({
        has_second_character: data.has_second_character || false,
        second_character_type: data.second_character_type as "inline" | "linked" | null,
        second_character_name: data.second_character_name || "",
        second_character_description: data.second_character_description || "",
        second_character_backstory: data.second_character_backstory || "",
        second_character_dialogue_style: data.second_character_dialogue_style || "",
        second_character_avatar_url: data.second_character_avatar_url || "",
        second_character_gender: data.second_character_gender || "",
        linked_chatbot_id: data.linked_chatbot_id || "",
      });

      setTags(data.tags || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setInitialLoading(false);
    }
  };

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
      // Validate second character if enabled
      if (secondCharacterData.has_second_character) {
        if (secondCharacterData.second_character_type === "inline") {
          if (!secondCharacterData.second_character_name || !secondCharacterData.second_character_description) {
            toast({
              title: "Missing second character info",
              description: "Please provide a name and description for the second character.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        } else if (secondCharacterData.second_character_type === "linked") {
          if (!secondCharacterData.linked_chatbot_id) {
            toast({
              title: "No chatbot linked",
              description: "Please select a chatbot to link as the second character.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
      }

      const { error } = await supabase
        .from("chatbots")
        .update({
          ...formData,
          tags,
          character_appearance: formData.character_appearance || null,
          has_second_character: secondCharacterData.has_second_character,
          second_character_type: secondCharacterData.second_character_type,
          second_character_name: secondCharacterData.second_character_name || null,
          second_character_description: secondCharacterData.second_character_description || null,
          second_character_backstory: secondCharacterData.second_character_backstory || null,
          second_character_dialogue_style: secondCharacterData.second_character_dialogue_style || null,
          second_character_avatar_url: secondCharacterData.second_character_avatar_url || null,
          second_character_gender: secondCharacterData.second_character_gender || null,
          linked_chatbot_id: secondCharacterData.linked_chatbot_id || null,
        })
        .eq("id", chatbotId);

      if (error) throw error;

      toast({ title: "Chatbot updated successfully!" });
      navigate(`/chat/${chatbotId}`);
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Edit Character
          </h1>
        </div>

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
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="image_model">Image Generation Model</Label>
                {!isPremium && (
                  <span className="text-xs text-muted-foreground">(Stable Diffusion requires Premium)</span>
                )}
              </div>
              <Select
                value={formData.image_generation_model}
                onValueChange={(value) => {
                  if (value === "stable-diffusion" && !isPremium) {
                    toast({
                      title: "Premium Required",
                      description: "Stable Diffusion is a premium feature. Upgrade to access it!",
                      variant: "destructive",
                    });
                    return;
                  }
                  setFormData({ ...formData, image_generation_model: value });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">DreamForge (Default)</SelectItem>
                  <SelectItem value="stable-diffusion" disabled={!isPremium}>
                    <div className="flex items-center gap-2">
                      Stable Diffusion
                      {!isPremium && <Crown className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </SelectItem>
                  <SelectItem value="gpt-image">GPT Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.image_generation_model === "stable-diffusion" && (
              <CharacterAppearanceField
                value={formData.character_appearance}
                onChange={(value) => setFormData({ ...formData, character_appearance: value })}
                characterName={formData.name}
                characterDescription={formData.description}
                characterGender={formData.gender}
              />
            )}

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

          {/* Second Character Section */}
          {user && (
            <SecondCharacterForm
              userId={user.id}
              data={secondCharacterData}
              onChange={setSecondCharacterData}
              excludeChatbotId={chatbotId}
            />
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Chatbot"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}