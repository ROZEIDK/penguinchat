import { useState } from "react";
import { Home, MessageSquare, PlusCircle, UserPlus, FileText, User, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Discover", url: "/", icon: Home },
  { title: "Chats", url: "/chats", icon: MessageSquare },
  { title: "Create", url: null, icon: PlusCircle }, // null url means it opens dialog
  { title: "Friends", url: "/notifications", icon: UserPlus },
  { title: "More", url: "/profile", icon: FileText },
];

export function MobileBottomNav() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => (
            item.url === null ? (
              <button
                key={item.title}
                onClick={handleCreateClick}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-primary"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </button>
            ) : (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground"
                activeClassName="text-primary"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </NavLink>
            )
          ))}
        </div>
      </nav>

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