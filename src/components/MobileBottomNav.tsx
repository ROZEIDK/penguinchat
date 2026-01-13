import { Home, MessageSquare, PlusCircle, UserPlus, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Discover", url: "/", icon: Home },
  { title: "Chats", url: "/chats", icon: MessageSquare },
  { title: "Create", url: "/create", icon: PlusCircle },
  { title: "Friends", url: "/notifications", icon: UserPlus },
  { title: "More", url: "/profile", icon: FileText },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
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
        ))}
      </div>
    </nav>
  );
}
