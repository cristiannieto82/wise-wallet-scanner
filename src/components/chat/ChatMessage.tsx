import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[80%] break-words",
          isAssistant
            ? "bg-muted text-foreground"
            : "bg-gradient-to-br from-green-500 to-green-600 text-white"
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
};
