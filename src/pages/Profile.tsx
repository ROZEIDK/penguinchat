import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, LogOut, X } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      setFormData({
        username: data.username || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile updated successfully!" });
      setEditing(false);
      fetchProfile(user.id);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Profile
          </h1>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              {formData.avatar_url ? (
                <div className="relative w-32 h-32">
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {editing && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2"
                      onClick={() =>
                        setFormData({ ...formData, avatar_url: "" })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary-foreground">
                    {formData.username[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {editing && !formData.avatar_url && (
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 rounded-lg transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <Upload className="h-8 w-8 text-white" />
                  )}
                </label>
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    {profile.username}
                  </h2>
                  <p className="text-muted-foreground">{profile.bio || "No bio yet"}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      username: profile.username || "",
                      bio: profile.bio || "",
                      avatar_url: profile.avatar_url || "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                className="w-full bg-secondary hover:bg-secondary/80"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
