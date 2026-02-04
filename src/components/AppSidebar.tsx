import { useState, useEffect } from "react";
import { Home, PlusCircle, Bell, MessageSquare, User, Coins, ImagePlus, HelpCircle, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Discover", url: "/", icon: Home },
  { title: "Generate Image", url: "/generate-image", icon: ImagePlus },
  { title: "Create", url: null, icon: PlusCircle }, // null means open dialog
  { title: "Notification", url: "/notifications", icon: Bell, badge: "new" },
];

const secondaryItems = [
  { title: "Subscribe", url: "/subscribe", icon: Coins },
  { title: "Coins", url: "/coins", icon: Coins },
  { title: "Chat", url: "/chats", icon: MessageSquare },
  { title: "Help & Guides", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchCoinBalance(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchCoinBalance(session.user.id);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchCoinBalance = async (userId: string) => {
    const { data } = await supabase
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setCoinBalance(data.balance);
    }
  };

  const handleCreateClick = () => {
    setShowCreateDialog(true);
  };

  const handleChoice = (type: "character" | "book") => {
    setShowCreateDialog(false);
    if (type === "character") {
      navigate("/create");
    } else {
      navigate("/create-book");
    }
  };

  return (
    <>
      <Sidebar className={`${collapsed ? "w-14" : "w-56"} border-r border-sidebar-border bg-sidebar-background`} collapsible="icon">
        <SidebarContent className="py-4">
          {/* Logo */}
          <div className="px-4 pb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-lg">🐧</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-foreground">PenguinChat</span>
            )}
          </div>
          
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.url === null ? (
                        <button
                          onClick={handleCreateClick}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-foreground hover:bg-sidebar-accent w-full text-left"
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && (
                            <span className="text-sm">{item.title}</span>
                          )}
                        </button>
                      ) : (
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-foreground hover:bg-sidebar-accent"
                          activeClassName="bg-primary/20 text-primary"
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.title}</span>
                              {item.badge && (
                                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          <div className="mx-4 my-2 border-t border-sidebar-border" />

          {/* Secondary Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-foreground hover:bg-sidebar-accent"
                        activeClassName="bg-primary/20 text-primary"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* User Profile at bottom */}
          {user && (
            <>
              <div className="flex-1" />
              <div className="px-4 py-2">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sidebar-foreground hover:bg-sidebar-accent"
                  activeClassName="bg-primary/20 text-primary"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  {!collapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Profile</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        {coinBalance.toLocaleString()}
                      </span>
                    </div>
                  )}
                </NavLink>
              </div>
            </>
          )}
        </SidebarContent>
      </Sidebar>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>What would you like to create?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 h-auto py-6"
              onClick={() => handleChoice("character")}
            >
              <User className="h-8 w-8 text-primary" />
              <span className="font-medium">Character</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 h-auto py-6"
              onClick={() => handleChoice("book")}
            >
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-medium">Book</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}