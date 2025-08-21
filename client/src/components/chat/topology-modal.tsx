import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import type { TopologyAnalysis, Session, Message } from "@shared/schema";

interface TopologyModalProps {
  topology?: TopologyAnalysis;
  session?: Session;
  messages: Message[];
  onClose: () => void;
}

export default function TopologyModal({ 
  topology, 
  session, 
  messages, 
  onClose 
}: TopologyModalProps) {
  if (!topology || !session) return null;

  const generateJsonPreview = () => {
    return JSON.stringify({
      session_id: session.id,
      timestamp: new Date().toISOString(),
      title: session.title,
      topology: {
        pattern: topology.pattern,
        order: session.topologyOrder,
        threads: session.threadCount,
        complexity: topology.complexity,
        prime_factors: topology.primeFactors,
        structure: topology.structure,
        nesting_depth: topology.nestingDepth
      },
      messages: messages.slice(0, 3).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
        topology_impact: msg.topologyImpact,
        timestamp: msg.createdAt
      })),
      metadata: {
        participant_count: 2,
        ai_model: "gpt-4o",
        total_messages: messages.length,
        created_at: session.createdAt,
        updated_at: session.updatedAt
      }
    }, null, 2);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conversation Topology Analysis</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="space-y-6 p-1">
            {/* Topology Visualization */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Current Pattern</h4>
              <div className="font-mono text-lg text-center bg-white dark:bg-gray-800 rounded p-3 border">
                {topology.pattern}
              </div>
            </div>

            {/* Pattern Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Thread Structure</h5>
                <div className="space-y-2 text-sm">
                  {(topology.structure as any)?.procedural?.map((thread: string, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="font-mono">[{thread}]</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Thread {index + 1}
                      </span>
                    </div>
                  ))}
                  {(topology.structure as any)?.perspectival?.map((perspective: string, index: number) => (
                    <div key={`persp-${index}`} className="flex justify-between">
                      <span className="font-mono">[{perspective}]</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        Perspective {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Complexity Metrics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Topology Order:</span>
                    <span className="font-semibold">{session.topologyOrder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thread Count:</span>
                    <span className="font-semibold">{session.threadCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nesting Depth:</span>
                    <span className="font-semibold">{topology.nestingDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className="font-semibold capitalize">{topology.complexity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prime Factors */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Prime Factors</h5>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(topology.primeFactors) && topology.primeFactors.map((factor: string, index: number) => (
                  <span
                    key={index}
                    className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm border"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* JSON Structure Preview */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">JSON Structure Preview</h4>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 dark:text-green-300 text-xs">
                  <code>{generateJsonPreview()}</code>
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
