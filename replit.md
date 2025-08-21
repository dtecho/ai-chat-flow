# Overview

This is a chat application that tracks conversation topology patterns. The app allows users to create chat sessions, send messages to an AI assistant, and analyze the topological structure of conversations. It features a React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and OpenAI integration for AI responses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA** with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom chat-specific color variables and gradients
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with session and message endpoints
- **In-memory storage fallback** via MemStorage class for development
- **Request logging middleware** with response time tracking
- **Error handling middleware** for centralized error responses

## Database Design
- **PostgreSQL** as the primary database with Neon serverless integration
- **Drizzle ORM** for type-safe database operations and schema management
- **Three main tables**:
  - `sessions`: Chat session metadata with topology tracking fields
  - `messages`: Individual chat messages with role and topology impact
  - `topology_analysis`: Detailed topology analysis data with complexity metrics
- **Schema validation** using drizzle-zod for runtime type checking

## Chat System Features
- **Multi-session support** with session creation and management
- **Real-time typing indicators** and message streaming
- **Topology analysis** that calculates conversation patterns, complexity, and structure
- **Export functionality** for sessions in JSON format
- **Responsive design** with mobile-optimized sidebar and chat interface

## External Dependencies

- **OpenAI API**: GPT-4o model integration for AI chat responses with system prompts that include topology awareness
- **Neon Database**: Serverless PostgreSQL hosting for production data persistence
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **TanStack Query**: Advanced data fetching and caching for optimistic updates
- **Drizzle Kit**: Database migration and schema management tooling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens