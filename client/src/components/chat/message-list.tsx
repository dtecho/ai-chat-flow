import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Download, Settings, Trash2 } from "lucide-react";
import TypingIndicator from "@/components/chat/typing-indicator";
import type { Message, Session } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
  currentSession?: Session;
  isTyping?: boolean;
  onExport: () => void;
}

export default function MessageList({ 
  messages, 
  currentSession, 
  isTyping = false,
  onExport 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Header */}
      <div className="chat-input-container border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            disabled={!currentSession}
            title="Export Session"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Session Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Clear Chat">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex justify-start fade-in">
              <div className="flex items-start space-x-3 max-w-2xl">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="chat-bubble-ai rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <p className="text-gray-900 dark:text-gray-100">
                    Welcome! I'm here to help you explore ideas while we analyze the topological patterns of our conversation. What would you like to discuss?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formatTime(new Date())} • Topology: s1={`{[()]}`} initialized
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex fade-in ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex items-start space-x-3 max-w-2xl ${
                message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={
                    message.role === "user" 
                      ? "bg-gray-300 text-gray-600" 
                      : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm"
                  }>
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "chat-bubble-user rounded-2xl rounded-tr-md text-white"
                    : "chat-bubble-ai rounded-2xl rounded-tl-md"
                }`}>
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <p className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-blue-200"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {formatTime(message.createdAt)}
                    {message.topologyImpact && (
                      <span className="ml-2">
                        • {message.topologyImpact.replace(/_/g, ' ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </>
  );
}
