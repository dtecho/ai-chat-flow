import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, Plus, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Session, TopologyAnalysis } from "@shared/schema";

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  topology?: TopologyAnalysis;
  onShowTopologyDetails: () => void;
}

export default function Sidebar({ 
  sessions, 
  currentSessionId, 
  onSessionSelect, 
  topology,
  onShowTopologyDetails 
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sessions', {
        title: `New Session ${new Date().toLocaleTimeString()}`
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      onSessionSelect(newSession.id);
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest('DELETE', `/api/sessions/${sessionId}`);
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      if (currentSessionId === sessionId) {
        onSessionSelect(sessions.find(s => s.id !== sessionId)?.id || '');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateSession = async () => {
    if (isCreating) return;
    setIsCreating(true);
    createSessionMutation.mutate();
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - sessionDate.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="w-80 chat-sidebar border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <Brain className="text-blue-600 mr-2 h-5 w-5" />
          AI Chat Topology
        </h1>
        <p className="text-sm text-gray-600">Participatory conversation analysis</p>
      </div>

      {/* New Session Button */}
      <div className="p-4">
        <Button
          onClick={handleCreateSession}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'New Session'}
        </Button>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={`rounded-lg p-3 cursor-pointer transition-colors group ${
                session.id === currentSessionId
                  ? 'session-active border-l-4'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                  {session.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {session.id === currentSessionId && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                  {session.id !== currentSessionId && (
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(session.updatedAt)}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Topology:</span>
                  <span className="font-mono bg-gray-100 px-1 rounded text-xs">
                    {session.topologyPattern}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span>{session.messageCount}</span>
                </div>
              </div>
            </div>
          ))}

          {sessions.length === 0 && !isCreating && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs">Create your first chat session</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Topology Analysis Panel */}
      {topology && (
        <>
          <Separator />
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
              Session Topology Analysis
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">
                  {topology.pattern}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium capitalize">
                  {topology.complexity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Threads:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {(topology.structure as any)?.procedural?.length || 1} active
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Depth:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {topology.nestingDepth}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowTopologyDetails}
              className="w-full mt-3 text-xs"
            >
              View Details
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
