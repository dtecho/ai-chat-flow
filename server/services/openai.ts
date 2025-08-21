import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ChatResponse {
  content: string;
  topologyImpact?: string;
}

export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  currentTopology: string
): Promise<ChatResponse> {
  try {
    const systemPrompt = `You are an AI assistant that helps users explore ideas while analyzing the topological patterns of conversations. 

Current conversation topology: ${currentTopology}

Provide thoughtful, engaging responses that contribute to meaningful dialogue. When appropriate, reference how the conversation is developing topologically, but keep this natural and not overly technical unless the user specifically asks about topology.

Be helpful, insightful, and maintain the flow of conversation while being aware that each exchange contributes to the evolving participatory topology of our interaction.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10) // Keep last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
    
    return {
      content,
      topologyImpact: determineTopologyImpact(content, messages.length)
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please check your API key and try again.");
  }
}

function determineTopologyImpact(content: string, messageCount: number): string {
  // Simple heuristics for topology impact
  if (content.includes("?") || content.toLowerCase().includes("what") || content.toLowerCase().includes("how")) {
    return "inquiry_branch";
  }
  if (content.toLowerCase().includes("conclusion") || content.toLowerCase().includes("summary")) {
    return "closure_attempt";
  }
  if (messageCount > 1) {
    return "thread_continuation";
  }
  return "thread_initiation";
}
