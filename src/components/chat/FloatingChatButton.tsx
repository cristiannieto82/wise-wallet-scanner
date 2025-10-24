import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export const FloatingChatButton = ({ onClick, hasUnread }: FloatingChatButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
        "bg-gradient-to-br from-green-500 to-green-600",
        "hover:from-green-600 hover:to-green-700",
        "transition-all duration-300 hover:scale-110",
        "z-50 group"
      )}
      size="icon"
    >
      <MessageCircle className="h-6 w-6 text-white transition-transform group-hover:rotate-12" />
      {hasUnread && (
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
      )}
      <span className="sr-only">Abrir Asesor Verde</span>
    </Button>
  );
};
