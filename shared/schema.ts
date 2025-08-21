import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  topologyPattern: text("topology_pattern").notNull().default("s1={[()]}"),
  topologyOrder: integer("topology_order").notNull().default(1),
  threadCount: integer("thread_count").notNull().default(1),
  messageCount: integer("message_count").notNull().default(0),
  isActive: varchar("is_active").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  topologyImpact: text("topology_impact"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topologyAnalysis = pgTable("topology_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  pattern: text("pattern").notNull(),
  primeFactors: jsonb("prime_factors").notNull(),
  structure: jsonb("structure").notNull(),
  complexity: text("complexity").notNull(),
  nestingDepth: integer("nesting_depth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTopologyAnalysisSchema = createInsertSchema(topologyAnalysis).omit({
  id: true,
  createdAt: true,
});

export type Session = typeof sessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type TopologyAnalysis = typeof topologyAnalysis.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertTopologyAnalysis = z.infer<typeof insertTopologyAnalysisSchema>;
