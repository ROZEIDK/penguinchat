import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Loader2, X, Users, Link2, UserPlus, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

interface SecondCharacterData {
  has_second_character: boolean;
  second_character_type: "inline" | "linked" | null;
  second_character_name: string;
  second_character_description: string;
  second_character_backstory: string;
  second_character_dialogue_style: string;
  second_character_avatar_url: string;
  second_character_gender: string;
  linked_chatbot_id: string;
}

interface SecondCharacterFormProps {
  userId: string;
  data: SecondCharacterData;
  onChange: (data: SecondCharacterData) => void;
  excludeChatbotId?: string; // Exclude this chatbot from the link options (for edit page)
}

export default function SecondCharacterForm({
  userId,
  data,
  onChange,
  excludeChatbotId,
}: SecondCharacterFormProps) {
  const [uploading, setUploading] = useState(false);
  const [availableChatbots, setAvailableChatbots] = useState<Tables<"chatbots">[]>([]);
  const [loadingChatbots, setLoadingChatbots] = useState(false);
  const { toast } = useToast();
  const { isPremium, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (data.has_second_character && data.second_character_type === "linked") {
      fetchAvailableChatbots();
    }
  }, [data.has_second_character, data.second_character_type]);

  const fetchAvailableChatbots = async () => {
    setLoadingChatbots(true);
    try {
      let query = supabase
        .from("chatbots")
        .select("*")
        .eq("creator_id", userId)
        .order("name");

      if (excludeChatbotId) {
        query = query.neq("id", excludeChatbotId);
      }

      const { data: chatbots, error } = await query;

      if (error) throw error;
      setAvailableChatbots(chatbots || []);
    } catch (error: any) {
      toast({
        title: "Error loading chatbots",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingChatbots(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("app-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("app-assets")
        .getPublicUrl(filePath);

      onChange({ ...data, second_character_avatar_url: urlData.publicUrl });
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

  const handleToggle = (enabled: boolean) => {
    onChange({
      ...data,
      has_second_character: enabled,
      second_character_type: enabled ? "inline" : null,
    });
  };

  const handleTypeChange = (type: "inline" | "linked") => {
    onChange({
      ...data,
      second_character_type: type,
      // Clear the opposite type's data
      ...(type === "linked"
        ? {
            second_character_name: "",
            second_character_description: "",
            second_character_backstory: "",
            second_character_dialogue_style: "",
            second_character_avatar_url: "",
            second_character_gender: "",
          }
        : { linked_chatbot_id: "" }),
    });
  };

  // Show premium locked state if not premium
  if (!isPremium && !subLoading) {
    return (
      <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dual Character Mode</h3>
          <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
            <Crown className="h-3 w-3" />
            Premium
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Add a second character that will also respond to the user in conversations.
          Both characters will reply to each message.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Unlock this feature with Premium
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate("/subscribe")}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:opacity-90"
          >
            <Crown className="h-4 w-4 mr-1" />
            Get Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Dual Character Mode</h3>
        <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
          <Crown className="h-3 w-3" />
          Premium
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Add a second character that will also respond to the user in conversations.
        Both characters will reply to each message.
      </p>

      <div className="flex items-center justify-between">
        <Label htmlFor="has_second_character">Enable Second Character</Label>
        <Switch
          id="has_second_character"
          checked={data.has_second_character}
          onCheckedChange={handleToggle}
        />
      </div>

      {data.has_second_character && (
        <>
          <div className="pt-4 border-t border-border">
            <Label className="mb-3 block">Character Source</Label>
            <RadioGroup
              value={data.second_character_type || "inline"}
              onValueChange={(value) => handleTypeChange(value as "inline" | "linked")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inline" id="inline" />
                <Label htmlFor="inline" className="flex items-center gap-2 cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  Create New Character
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="linked" id="linked" />
                <Label htmlFor="linked" className="flex items-center gap-2 cursor-pointer">
                  <Link2 className="h-4 w-4" />
                  Link Existing Chatbot
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.second_character_type === "linked" ? (
            <div className="pt-4 space-y-4">
              <div>
                <Label>Select Chatbot to Link</Label>
                {loadingChatbots ? (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your chatbots...
                  </div>
                ) : availableChatbots.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    You don't have any other chatbots to link. Create one first or use the inline option.
                  </p>
                ) : (
                  <Select
                    value={data.linked_chatbot_id}
                    onValueChange={(value) =>
                      onChange({ ...data, linked_chatbot_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a chatbot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChatbots.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          <div className="flex items-center gap-2">
                            {bot.avatar_url ? (
                              <img
                                src={bot.avatar_url}
                                alt={bot.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {bot.name.charAt(0)}
                              </div>
                            )}
                            {bot.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-4">
              {/* Avatar Upload */}
              <div>
                <Label className="block mb-2">Second Character Avatar</Label>
                <div className="flex items-center gap-4">
                  {data.second_character_avatar_url ? (
                    <div className="relative w-20 h-20">
                      <img
                        src={data.second_character_avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() =>
                          onChange({ ...data, second_character_avatar_url: "" })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="second_name">Name *</Label>
                <Input
                  id="second_name"
                  value={data.second_character_name}
                  onChange={(e) =>
                    onChange({ ...data, second_character_name: e.target.value })
                  }
                  required={data.has_second_character && data.second_character_type === "inline"}
                  className="mt-1"
                  placeholder="Second character's name"
                />
              </div>

              <div>
                <Label htmlFor="second_description">Description *</Label>
                <Textarea
                  id="second_description"
                  value={data.second_character_description}
                  onChange={(e) =>
                    onChange({ ...data, second_character_description: e.target.value })
                  }
                  required={data.has_second_character && data.second_character_type === "inline"}
                  className="mt-1"
                  rows={2}
                  placeholder="Describe the second character's personality"
                />
              </div>

              <div>
                <Label htmlFor="second_gender">Gender</Label>
                <Input
                  id="second_gender"
                  value={data.second_character_gender}
                  onChange={(e) =>
                    onChange({ ...data, second_character_gender: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="second_backstory">Backstory</Label>
                <Textarea
                  id="second_backstory"
                  value={data.second_character_backstory}
                  onChange={(e) =>
                    onChange({ ...data, second_character_backstory: e.target.value })
                  }
                  className="mt-1"
                  rows={2}
                  placeholder="Background story for the second character"
                />
              </div>

              <div>
                <Label htmlFor="second_dialogue_style">Dialogue Style</Label>
                <Input
                  id="second_dialogue_style"
                  value={data.second_character_dialogue_style}
                  onChange={(e) =>
                    onChange({ ...data, second_character_dialogue_style: e.target.value })
                  }
                  className="mt-1"
                  placeholder="e.g., Formal, Casual, Playful"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
