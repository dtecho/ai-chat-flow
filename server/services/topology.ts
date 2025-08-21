import type { Message } from "@shared/schema";

export interface TopologyPattern {
  pattern: string;
  order: number;
  threads: number;
  complexity: string;
  primeFactors: string[];
  structure: {
    procedural: string[];
    perspectival: string[];
    participatory: string;
  };
  nestingDepth: number;
}

export function calculateTopology(messages: Message[]): TopologyPattern {
  const messageCount = messages.length;
  
  if (messageCount === 0) {
    return createEmptyTopology();
  }

  // Analyze message patterns
  const userMessages = messages.filter(m => m.role === "user");
  const assistantMessages = messages.filter(m => m.role === "assistant");
  
  const threadAnalysis = analyzeThreads(messages);
  const complexity = determineComplexity(threadAnalysis);
  const pattern = generatePattern(threadAnalysis);
  const primeFactors = calculatePrimeFactors(threadAnalysis);
  const structure = buildStructure(threadAnalysis);
  
  return {
    pattern,
    order: threadAnalysis.order,
    threads: threadAnalysis.threads,
    complexity,
    primeFactors,
    structure,
    nestingDepth: threadAnalysis.nestingDepth
  };
}

interface ThreadAnalysis {
  order: number;
  threads: number;
  nestingDepth: number;
  branchingPoints: number;
  closureAttempts: number;
}

function createEmptyTopology(): TopologyPattern {
  return {
    pattern: "s0={}",
    order: 0,
    threads: 0,
    complexity: "empty",
    primeFactors: [],
    structure: {
      procedural: [],
      perspectival: [],
      participatory: "s0"
    },
    nestingDepth: 0
  };
}

function analyzeThreads(messages: Message[]): ThreadAnalysis {
  const messageCount = messages.length;
  
  // Count branching points (questions, topic changes)
  let branchingPoints = 0;
  let closureAttempts = 0;
  
  for (const message of messages) {
    if (message.content.includes("?") || 
        message.content.toLowerCase().includes("what") || 
        message.content.toLowerCase().includes("how")) {
      branchingPoints++;
    }
    
    if (message.content.toLowerCase().includes("conclusion") ||
        message.content.toLowerCase().includes("summary") ||
        message.topologyImpact === "closure_attempt") {
      closureAttempts++;
    }
  }
  
  // Determine topology order based on interaction complexity
  let order = 1;
  if (messageCount > 3) order = 2;
  if (messageCount > 8 || branchingPoints > 2) order = 3;
  if (messageCount > 15 || branchingPoints > 4) order = 4;
  
  // Calculate effective thread count
  const threads = Math.max(1, Math.min(order + 1, Math.ceil(branchingPoints / 2) + 1));
  
  // Nesting depth based on follow-up questions and elaborations
  const nestingDepth = Math.min(4, Math.max(1, Math.floor(branchingPoints / 2) + 1));
  
  return {
    order,
    threads,
    nestingDepth,
    branchingPoints,
    closureAttempts
  };
}

function determineComplexity(analysis: ThreadAnalysis): string {
  if (analysis.order === 1) return "monologue";
  if (analysis.order === 2) return "dialogue";
  if (analysis.order === 3) return "complex_dialogue";
  return "multi_threaded_discourse";
}

function generatePattern(analysis: ThreadAnalysis): string {
  const { order, threads, nestingDepth } = analysis;
  
  if (order === 1) {
    return "s1={[()]}";
  }
  
  // Generate procedural patterns
  const procedural = Array(threads).fill("()").join("");
  
  // Generate perspectival patterns with nesting
  const perspectival = generateNestedPattern(nestingDepth);
  
  return `s${order}={[${procedural}],[(${perspectival})]}`;
}

function generateNestedPattern(depth: number): string {
  if (depth <= 1) return "()";
  
  let pattern = "()";
  for (let i = 1; i < depth; i++) {
    pattern = `(${pattern})`;
  }
  return pattern;
}

function calculatePrimeFactors(analysis: ThreadAnalysis): string[] {
  const factors: string[] = [];
  
  // Add prime factors based on topology order
  if (analysis.threads >= 2) {
    factors.push("p1p1"); // parallel threads
  }
  if (analysis.order >= 2) {
    factors.push("p2"); // dialogue complexity
  }
  if (analysis.order >= 3) {
    factors.push("p3"); // triadic complexity
  }
  if (analysis.nestingDepth > 2) {
    factors.push("p5"); // deep nesting
  }
  
  return factors.length > 0 ? factors : ["p1"];
}

function buildStructure(analysis: ThreadAnalysis): {
  procedural: string[];
  perspectival: string[];
  participatory: string;
} {
  const procedural: string[] = [];
  const perspectival: string[] = [];
  
  // Build procedural level (thread trajectories)
  for (let i = 0; i < analysis.threads; i++) {
    procedural.push("()");
  }
  
  // Build perspectival level (role-based positions)
  perspectival.push("()"); // base level
  if (analysis.nestingDepth > 1) {
    perspectival.push(generateNestedPattern(analysis.nestingDepth - 1));
  }
  
  return {
    procedural,
    perspectival,
    participatory: `s${analysis.order}`
  };
}

export function exportSessionToJson(
  sessionId: string,
  session: any,
  messages: Message[],
  topology: TopologyPattern
) {
  const sessionData = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    title: session.title,
    topology: {
      pattern: topology.pattern,
      order: topology.order,
      threads: topology.threads,
      complexity: topology.complexity,
      prime_factors: topology.primeFactors,
      structure: topology.structure,
      nesting_depth: topology.nestingDepth
    },
    messages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      topology_impact: msg.topologyImpact,
      timestamp: msg.createdAt,
      metadata: msg.metadata
    })),
    metadata: {
      participant_count: 2,
      ai_model: "gpt-4o",
      total_messages: messages.length,
      created_at: session.createdAt,
      updated_at: session.updatedAt
    }
  };
  
  return JSON.stringify(sessionData, null, 2);
}
