import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-2xl">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="chat-bubble-ai rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
