import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";

interface ChatbotCardProps {
  chatbot: {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    tags: string[];
    total_views: number;
    creator_id: string;
    average_rating?: number;
    review_count?: number;
  };
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

export function ChatbotCard({ chatbot, currentUserId, onDelete }: ChatbotCardProps) {
  const navigate = useNavigate();
  const isOwner = currentUserId && chatbot.creator_id === currentUserId;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/chat/${chatbot.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
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
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/edit/${chatbot.id}`);
              }}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(chatbot.id);
              }}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {chatbot.total_views} views
          </div>
          {chatbot.average_rating !== undefined && chatbot.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(chatbot.average_rating)} size="sm" />
              <span className="text-xs">({chatbot.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
