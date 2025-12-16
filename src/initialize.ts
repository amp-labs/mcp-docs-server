import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SERVER_NAME, SERVER_VERSION } from '../settings.js';
import { logger } from './logger.js';

export function initialize(): McpServer {
  logger.log('Initializing MCP Server...');
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  return server;
}
