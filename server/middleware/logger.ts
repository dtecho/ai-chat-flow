import { Request, Response, NextFunction } from "express";
import { mkdir, writeFile, appendFile } from "fs/promises";
import { join } from "path";

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers: any;
  body?: any;
  query?: any;
  params?: any;
}

interface ResponseLog {
  timestamp: string;
  statusCode: number;
  headers: any;
  body?: any;
  duration: number;
}

interface ApiLogEntry {
  request: RequestLog;
  response: ResponseLog;
  sessionId?: string;
  messageId?: string;
  topologyId?: string;
}

export async function createApiLogger() {
  // Ensure log directories exist
  await ensureDirectories();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json;
    const originalSend = res.send;
    
    let responseBody: any = null;
    
    // Capture response data
    res.json = function(body) {
      responseBody = body;
      return originalJson.call(this, body);
    };
    
    res.send = function(body) {
      if (responseBody === null) {
        try {
          responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch {
          responseBody = body;
        }
      }
      return originalSend.call(this, body);
    };
    
    // Log request and response
    res.on('finish', async () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const logEntry: ApiLogEntry = {
        request: {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          query: req.query,
          params: req.params
        },
        response: {
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: responseBody,
          duration
        }
      };
      
      // Extract IDs for structured logging
      if (req.params.id && req.url.includes('/sessions/')) {
        logEntry.sessionId = req.params.id;
      }
      if (responseBody?.id && req.method === 'POST' && req.url.includes('/messages')) {
        logEntry.messageId = responseBody.id;
      }
      if (responseBody?.id && req.url.includes('/topology')) {
        logEntry.topologyId = responseBody.id;
      }
      
      // Log to raw console/api structure
      await logToRawConsole(logEntry);
      
      // Log to organized chat structure
      await logToChatStructure(logEntry);
    });
    
    next();
  };
}

async function ensureDirectories() {
  const dirs = [
    'console/api/GET',
    'console/api/POST', 
    'console/api/PUT',
    'console/api/DELETE',
    'chat/sessions',
    'chat/raw'
  ];
  
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

async function logToRawConsole(logEntry: ApiLogEntry) {
  const { method, url } = logEntry.request;
  const { statusCode, duration } = logEntry.response;
  
  // Create file path mirroring API structure
  const urlParts = url.replace(/^\/api\//, '').split('/');
  const dirPath = join('console/api', method, ...urlParts.slice(0, -1));
  const fileName = urlParts[urlParts.length - 1] || 'index';
  
  // Ensure directory exists
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Generate filename with timestamp and status
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fullFileName = `${fileName}_${statusCode}_${timestamp}.json`;
  const filePath = join(dirPath, fullFileName);
  
  try {
    await writeFile(filePath, JSON.stringify(logEntry, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write raw console log:', error);
  }
  
  // Also append to a combined log for the endpoint
  const combinedLogPath = join(dirPath, `${fileName}_combined.jsonl`);
  try {
    await appendFile(combinedLogPath, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (error) {
    console.error('Failed to append to combined log:', error);
  }
}

async function logToChatStructure(logEntry: ApiLogEntry) {
  const { url, method } = logEntry.request;
  const { statusCode, body } = logEntry.response;
  
  // Only process successful API calls
  if (statusCode >= 400) return;
  
  try {
    if (url.includes('/sessions') && method === 'GET' && !url.includes('/messages') && !url.includes('/topology')) {
      // Session list or specific session
      if (url === '/api/sessions') {
        // Sessions list
        await writeFile('chat/sessions.json', JSON.stringify(body, null, 2), 'utf8');
      } else {
        // Specific session
        const sessionId = extractSessionId(url);
        if (sessionId) {
          await ensureSessionDirectory(sessionId);
          await writeFile(`chat/sessions/${sessionId}/session.json`, JSON.stringify(body, null, 2), 'utf8');
        }
      }
    } else if (url.includes('/messages')) {
      const sessionId = extractSessionId(url);
      if (sessionId) {
        await ensureSessionDirectory(sessionId);
        
        if (method === 'GET') {
          // Messages list
          await writeFile(`chat/sessions/${sessionId}/messages.json`, JSON.stringify(body, null, 2), 'utf8');
          
          // Individual message files
          if (Array.isArray(body)) {
            await mkdir(`chat/sessions/${sessionId}/messages`, { recursive: true });
            for (const message of body) {
              await writeFile(`chat/sessions/${sessionId}/messages/${message.id}.json`, JSON.stringify(message, null, 2), 'utf8');
            }
          }
        } else if (method === 'POST') {
          // New message created
          await ensureSessionDirectory(sessionId);
          await mkdir(`chat/sessions/${sessionId}/messages`, { recursive: true });
          
          // Log the user message
          if (body.userMessage) {
            await writeFile(`chat/sessions/${sessionId}/messages/${body.userMessage.id}.json`, JSON.stringify(body.userMessage, null, 2), 'utf8');
          }
          
          // Log the AI message  
          if (body.aiMessage) {
            await writeFile(`chat/sessions/${sessionId}/messages/${body.aiMessage.id}.json`, JSON.stringify(body.aiMessage, null, 2), 'utf8');
          }
          
          // Update topology if provided
          if (body.topology) {
            await writeFile(`chat/sessions/${sessionId}/topology.json`, JSON.stringify(body.topology, null, 2), 'utf8');
            await writeFile(`chat/sessions/${sessionId}/messages/messages.topology.json`, JSON.stringify(body.topology, null, 2), 'utf8');
          }
        }
      }
    } else if (url.includes('/topology')) {
      const sessionId = extractSessionId(url);
      if (sessionId && method === 'GET') {
        await ensureSessionDirectory(sessionId);
        await writeFile(`chat/sessions/${sessionId}/topology.json`, JSON.stringify(body, null, 2), 'utf8');
      }
    } else if (method === 'POST' && url === '/api/sessions') {
      // New session created
      if (body.id) {
        await ensureSessionDirectory(body.id);
        await writeFile(`chat/sessions/${body.id}/session.json`, JSON.stringify(body, null, 2), 'utf8');
      }
    }
    
    // Update master chat log
    const chatLog = {
      timestamp: new Date().toISOString(),
      totalSessions: await countDirectories('chat/sessions'),
      lastActivity: logEntry
    };
    await writeFile('chat/chat.json', JSON.stringify(chatLog, null, 2), 'utf8');
    
  } catch (error) {
    console.error('Failed to log to chat structure:', error);
  }
}

function extractSessionId(url: string): string | null {
  const matches = url.match(/\/sessions\/([^\/]+)/);
  return matches ? matches[1] : null;
}

async function ensureSessionDirectory(sessionId: string) {
  const sessionDir = `chat/sessions/${sessionId}`;
  try {
    await mkdir(sessionDir, { recursive: true });
    await mkdir(`${sessionDir}/messages`, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function countDirectories(path: string): Promise<number> {
  try {
    const { readdir } = await import('fs/promises');
    const { stat } = await import('fs/promises');
    
    const items = await readdir(path);
    let count = 0;
    
    for (const item of items) {
      const itemPath = join(path, item);
      const stats = await stat(itemPath);
      if (stats.isDirectory()) {
        count++;
      }
    }
    
    return count;
  } catch {
    return 0;
  }
}