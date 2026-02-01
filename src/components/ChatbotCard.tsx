import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    has_second_character?: boolean;
  };
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + "M";
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + "K";
  }
  return views.toString();
}

export function ChatbotCard({ chatbot, currentUserId, onDelete }: ChatbotCardProps) {
  const navigate = useNavigate();
  const isOwner = currentUserId && chatbot.creator_id === currentUserId;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate(`/chatbot/${chatbot.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer relative rounded-xl overflow-hidden bg-card hover:ring-2 hover:ring-primary/50 transition-all duration-300"
    >
      {/* Image Container - Taller aspect ratio like reference */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {chatbot.avatar_url ? (
          <img
            src={chatbot.avatar_url}
            alt={chatbot.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center">
            <span className="text-4xl md:text-6xl font-bold text-primary-foreground/80">
              {chatbot.name[0]}
            </span>
          </div>
        )}
        
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* View count badge - positioned like reference */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div className="flex items-center gap-1 text-white text-xs md:text-sm bg-black/40 px-1.5 py-0.5 rounded">
            <Eye className="h-3 w-3 md:h-4 md:w-4" />
            <span>{formatViews(chatbot.total_views)}</span>
          </div>
          {chatbot.has_second_character && (
            <div className="flex items-center gap-1 text-white text-xs md:text-sm bg-primary/80 px-1.5 py-0.5 rounded" title="Dual Character">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
            </div>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/edit/${chatbot.id}`);
              }}
              className="h-7 w-7 md:h-8 md:w-8 bg-black/50 hover:bg-black/70 border-0"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(chatbot.id);
              }}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content - Compact for mobile */}
      <div className="p-2 md:p-3">
        <h3 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1 truncate text-foreground">
          {chatbot.name}
        </h3>
        <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">
          {chatbot.description}
        </p>
      </div>
    </div>
  );
}
