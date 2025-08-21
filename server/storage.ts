import { type Session, type Message, type TopologyAnalysis, type InsertSession, type InsertMessage, type InsertTopologyAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  deleteMessagesBySession(sessionId: string): Promise<boolean>;
  
  // Topology methods
  saveTopologyAnalysis(analysis: InsertTopologyAnalysis): Promise<TopologyAnalysis>;
  getTopologyAnalysis(sessionId: string): Promise<TopologyAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private messages: Map<string, Message>;
  private topologyAnalyses: Map<string, TopologyAnalysis>;

  constructor() {
    this.sessions = new Map();
    this.messages = new Map();
    this.topologyAnalyses = new Map();
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const session: Session = {
      id,
      title: insertSession.title,
      topologyPattern: insertSession.topologyPattern || "s1={[()]}",
      topologyOrder: insertSession.topologyOrder || 1,
      threadCount: insertSession.threadCount || 1,
      messageCount: insertSession.messageCount || 0,
      isActive: insertSession.isActive || "false",
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return undefined;

    const updatedSession: Session = {
      ...existingSession,
      ...updates,
      updatedAt: new Date()
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    // Also delete related messages and topology analysis
    const messages = Array.from(this.messages.values()).filter(m => m.sessionId === id);
    for (const message of messages) {
      this.messages.delete(message.id);
    }
    
    // Delete topology analysis
    const analysis = Array.from(this.topologyAnalyses.values()).find(a => a.sessionId === id);
    if (analysis) {
      this.topologyAnalyses.delete(analysis.id);
    }
    
    return this.sessions.delete(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      sessionId: insertMessage.sessionId,
      role: insertMessage.role,
      content: insertMessage.content,
      topologyImpact: insertMessage.topologyImpact || null,
      metadata: insertMessage.metadata || null,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async deleteMessagesBySession(sessionId: string): Promise<boolean> {
    const messages = Array.from(this.messages.values()).filter(m => m.sessionId === sessionId);
    for (const message of messages) {
      this.messages.delete(message.id);
    }
    return true;
  }

  async saveTopologyAnalysis(insertAnalysis: InsertTopologyAnalysis): Promise<TopologyAnalysis> {
    const id = randomUUID();
    const analysis: TopologyAnalysis = {
      ...insertAnalysis,
      id,
      createdAt: new Date()
    };
    
    // Remove any existing analysis for this session
    const existing = Array.from(this.topologyAnalyses.values()).find(a => a.sessionId === insertAnalysis.sessionId);
    if (existing) {
      this.topologyAnalyses.delete(existing.id);
    }
    
    this.topologyAnalyses.set(id, analysis);
    return analysis;
  }

  async getTopologyAnalysis(sessionId: string): Promise<TopologyAnalysis | undefined> {
    return Array.from(this.topologyAnalyses.values()).find(a => a.sessionId === sessionId);
  }
}

export const storage = new MemStorage();
