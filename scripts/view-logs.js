#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

function formatTime(date) {
  return new Date(date).toLocaleString();
}

function printDirectory(dirPath, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth || !fs.existsSync(dirPath)) return;
  
  try {
    const items = fs.readdirSync(dirPath);
    items.sort((a, b) => {
      const aStats = fs.statSync(path.join(dirPath, a));
      const bStats = fs.statSync(path.join(dirPath, b));
      
      // Directories first, then files
      if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
      if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
      
      // Then by name
      return a.localeCompare(b);
    });
    
    items.forEach((item, index) => {
      const itemPath = path.join(dirPath, item);
      const isLast = index === items.length - 1;
      const connector = isLast ? '└──' : '├──';
      
      try {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          console.log(`${prefix}${connector}📁 ${item}/`);
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          printDirectory(itemPath, nextPrefix, maxDepth, currentDepth + 1);
        } else {
          let icon = '📄';
          let info = '';
          
          if (item.includes('session')) icon = '🧮';
          else if (item.includes('message')) icon = '🔄';
          else if (item.includes('topology')) icon = '🧩';
          else if (item.includes('chat.json')) icon = '🧠';
          else if (item.endsWith('.jsonl')) icon = '📋';
          
          if (item.endsWith('.json') || item.endsWith('.jsonl')) {
            info = ` (${formatSize(stats.size)})`;
            
            // Try to show brief content for small JSON files
            if (stats.size < 2048) {
              try {
                const content = fs.readFileSync(itemPath, 'utf8');
                if (item.endsWith('.json')) {
                  const data = JSON.parse(content);
                  if (data.id) info += ` [ID: ${data.id.substring(0, 8)}...]`;
                  if (data.response && data.response.statusCode) info += ` [${data.response.statusCode}]`;
                  if (data.timestamp) info += ` [${formatTime(data.timestamp)}]`;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
          
          console.log(`${prefix}${connector}${icon} ${item}${info}`);
        }
      } catch (error) {
        console.log(`${prefix}${connector}❌ ${item} (error reading stats)`);
      }
    });
  } catch (error) {
    console.log(`${prefix}❌ Error reading directory: ${error.message}`);
  }
}

function showLogSummary() {
  console.log('📊 API Logging Summary');
  console.log('=' * 50);
  
  // Count raw API logs
  const consolePath = 'console/api';
  if (fs.existsSync(consolePath)) {
    console.log('\n🗂️  Raw API Logs (console/api/):');
    ['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
      const methodPath = path.join(consolePath, method);
      if (fs.existsSync(methodPath)) {
        const files = fs.readdirSync(methodPath).filter(f => f.endsWith('.json'));
        console.log(`   ${method}: ${files.length} requests logged`);
      }
    });
  }
  
  // Count chat sessions
  const chatSessionsPath = 'chat/sessions';
  if (fs.existsSync(chatSessionsPath)) {
    const sessions = fs.readdirSync(chatSessionsPath).filter(item => {
      return fs.statSync(path.join(chatSessionsPath, item)).isDirectory();
    });
    console.log(`\n💬 Chat Sessions: ${sessions.length} active sessions`);
    
    sessions.forEach(sessionId => {
      const sessionPath = path.join(chatSessionsPath, sessionId);
      const messagesPath = path.join(sessionPath, 'messages');
      
      let messageCount = 0;
      if (fs.existsSync(messagesPath)) {
        messageCount = fs.readdirSync(messagesPath).filter(f => f.endsWith('.json') && !f.includes('topology')).length;
      }
      
      console.log(`   📁 ${sessionId.substring(0, 8)}... (${messageCount} messages)`);
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'tree';
  
  console.log('🔍 Chat Application Log Viewer\n');
  
  switch (command) {
    case 'summary':
    case 's':
      showLogSummary();
      break;
      
    case 'console':
    case 'c':
      console.log('📁 Raw Console API Logs:');
      printDirectory('console/api', '', 4);
      break;
      
    case 'chat':
      console.log('💬 Organized Chat Structure:');
      printDirectory('chat', '', 4);
      break;
      
    case 'tree':
    case 't':
    default:
      console.log('📁 Complete Log Structure:');
      printDirectory('.', '', 3);
      
      console.log('\n📋 Available commands:');
      console.log('  node scripts/view-logs.js [tree|t]     - Show complete structure (default)');
      console.log('  node scripts/view-logs.js [summary|s]  - Show logging summary');
      console.log('  node scripts/view-logs.js [console|c]  - Show raw API logs only');
      console.log('  node scripts/view-logs.js chat         - Show chat structure only');
      break;
  }
}

main();