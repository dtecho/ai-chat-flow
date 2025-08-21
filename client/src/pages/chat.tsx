import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/chat/sidebar";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import TopologyModal from "@/components/chat/topology-modal";
import type { Session, Message, TopologyAnalysis } from "@shared/schema";

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isTopologyModalOpen, setIsTopologyModalOpen] = useState(false);

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
  });

  const { data: currentSession } = useQuery<Session>({
    queryKey: ['/api/sessions', currentSessionId],
    enabled: !!currentSessionId,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
  });

  const { data: topology } = useQuery<TopologyAnalysis>({
    queryKey: ['/api/sessions', currentSessionId, 'topology'],
    enabled: !!currentSessionId,
  });

  return (
    <div className="flex h-screen max-w-7xl mx-auto chat-gradient-bg">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={setCurrentSessionId}
        topology={topology}
        onShowTopologyDetails={() => setIsTopologyModalOpen(true)}
      />

      <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm">
        <MessageList 
          messages={messages} 
          currentSession={currentSession}
          onExport={() => {
            if (currentSessionId) {
              window.open(`/api/sessions/${currentSessionId}/export`, '_blank');
            }
          }}
        />

        {currentSessionId && (
          <MessageInput 
            sessionId={currentSessionId}
            topology={topology}
            onShowTopologyDetails={() => setIsTopologyModalOpen(true)}
          />
        )}
      </div>

      {isTopologyModalOpen && (
        <TopologyModal
          topology={topology}
          session={currentSession}
          messages={messages}
          onClose={() => setIsTopologyModalOpen(false)}
        />
      )}
    </div>
  );
}
