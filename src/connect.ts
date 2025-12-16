import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { detect } from 'detect-port';
import { randomUUID } from 'crypto';
import { logger } from './logger.js';

const DEFAULT_PORT = 3001;

export async function connectServer(
  server: Server,
  useStdioTransport: boolean,
): Promise<express.Application | undefined> {
  if (useStdioTransport) {
    logger.log('Connecting to MCP server over stdio');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  const app = express();
  // Use Railway's PORT env var if available, otherwise detect available port
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : await detect(DEFAULT_PORT);

  // Increase JSON payload limit to handle larger messages
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint for Railway
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'mcp-docs-server' });
  });

  // Create StreamableHTTP transport with stateful session management
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      logger.log('Session initialized:', sessionId);
    },
    onsessionclosed: (sessionId: string) => {
      logger.log('Session closed:', sessionId);
    },
  });

  // Connect the server to the transport
  await server.connect(transport);

  // Single unified endpoint for all MCP communication (GET, POST, DELETE)
  app.all('/mcp', async (req, res) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.listen(port, () => {
    if (port !== DEFAULT_PORT) {
      logger.log(
        `Port ${DEFAULT_PORT} is already in use. MCP Server running on Streamable HTTP at http://localhost:${port}/mcp`,
      );
    } else {
      logger.log(
        `MCP Server running on Streamable HTTP at http://localhost:${port}/mcp`,
      );
    }
  });

  return app;
}
