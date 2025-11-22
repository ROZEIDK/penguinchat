import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface ChatbotCardProps {
  chatbot: {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    tags: string[];
    total_views: number;
  };
}

export function ChatbotCard({ chatbot }: ChatbotCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/chat/${chatbot.id}`)}
      className="group cursor-pointer bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow overflow-hidden"
    >
      <div className="aspect-square relative overflow-hidden">
        {chatbot.avatar_url ? (
          <img
            src={chatbot.avatar_url}
            alt={chatbot.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <span className="text-6xl font-bold text-primary-foreground">
              {chatbot.name[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2 truncate">{chatbot.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {chatbot.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {chatbot.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Eye className="h-4 w-4 mr-1" />
          {chatbot.total_views} views
        </div>
      </div>
    </Card>
  );
}
