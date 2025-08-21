import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/openai";
import { calculateTopology, exportSessionToJson } from "./services/topology";
import { insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new session
  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse({
        title: req.body.title || "New Chat Session",
        topologyPattern: "s1={[()]}",
        topologyOrder: 1,
        threadCount: 1,
        messageCount: 0,
        isActive: "true"
      });
      
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create session" 
      });
    }
  });

  // Get all sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch sessions" 
      });
    }
  });

  // Get session by ID
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch session" 
      });
    }
  });

  // Delete session
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete session" 
      });
    }
  });

  // Get messages for a session
  app.get("/api/sessions/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesBySession(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch messages" 
      });
    }
  });

  // Send message and get AI response
  app.post("/api/sessions/:id/messages", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        sessionId,
        role: "user",
        content,
        topologyImpact: "user_input"
      });

      // Get conversation history
      const messages = await storage.getMessagesBySession(sessionId);
      const conversationHistory = messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      // Generate AI response
      const aiResponse = await generateChatResponse(
        conversationHistory,
        session.topologyPattern
      );

      // Create AI message
      const aiMessage = await storage.createMessage({
        sessionId,
        role: "assistant",
        content: aiResponse.content,
        topologyImpact: aiResponse.topologyImpact
      });

      // Calculate new topology
      const updatedMessages = await storage.getMessagesBySession(sessionId);
      const topology = calculateTopology(updatedMessages);
      
      // Update session with new topology
      await storage.updateSession(sessionId, {
        topologyPattern: topology.pattern,
        topologyOrder: topology.order,
        threadCount: topology.threads,
        messageCount: updatedMessages.length
      });

      // Save topology analysis
      await storage.saveTopologyAnalysis({
        sessionId,
        pattern: topology.pattern,
        primeFactors: topology.primeFactors,
        structure: topology.structure,
        complexity: topology.complexity,
        nestingDepth: topology.nestingDepth
      });

      res.json({
        userMessage,
        aiMessage,
        topology
      });
    } catch (error) {
      console.error("Message processing error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process message" 
      });
    }
  });

  // Get topology analysis for session
  app.get("/api/sessions/:id/topology", async (req, res) => {
    try {
      const analysis = await storage.getTopologyAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Topology analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch topology analysis" 
      });
    }
  });

  // Export session as JSON
  app.get("/api/sessions/:id/export", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const messages = await storage.getMessagesBySession(req.params.id);
      const topology = calculateTopology(messages);
      
      const jsonData = exportSessionToJson(req.params.id, session, messages, topology);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="session_${req.params.id}.json"`);
      res.send(jsonData);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to export session" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
