import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { detect } from 'detect-port';
import { logger } from './logger.js';

/**
 * Similar to https://github.com/modelcontextprotocol/typescript-sdk/pull/197/files
 */
class TransportManager {
  private transports: Map<string, SSEServerTransport>;

  constructor() {
    this.transports = new Map();
  }

  addTransport(transport: SSEServerTransport, res: Response): string {
    const sessionId = transport.sessionId;
    this.transports.set(sessionId, transport);

    // Set up cleanup when response ends
    res.on('close', () => {
      this.removeTransport(sessionId);
    });

    return sessionId;
  }

  removeTransport(sessionId: string) {
    if (this.transports.has(sessionId)) {
      this.transports.delete(sessionId);
    }
  }

  getTransport(sessionId: string): SSEServerTransport | undefined {
    return this.transports.get(sessionId);
  }

  getAllTransports(): SSEServerTransport[] {
    return Array.from(this.transports.values());
  }
}

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
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : await detect(DEFAULT_PORT);
  const transportManager = new TransportManager();

  // Increase JSON payload limit to handle larger messages
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint for Railway
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'mcp-docs-server' });
  });

  app.get('/sse', async (req: Request, res: Response) => {
    try {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const transport = new SSEServerTransport('/messages', res);
      transportManager.addTransport(transport, res);

      await server.connect(transport);
    } catch (error) {
      logger.error('Error establishing SSE connection:', error);
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  });

  app.post('/messages', async (req: Request, res: Response) => {
    const connectionId = req.query.sessionId as string;

    logger.log('Connection ID', connectionId);
    if (!connectionId) {
      res.status(400).json({ error: 'Missing connection ID param' });
      return;
    }

    const transport = transportManager.getTransport(connectionId);

    if (transport) {
      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        logger.error(
          'Error handling POST message for connectionId:',
          connectionId,
          error,
        );

        // If there's a critical error, clean up the transport
        if (
          error instanceof Error &&
          error.message.includes('connection closed')
        ) {
          transportManager.removeTransport(connectionId);
        }
      }
    } else {
      res.status(404).json({ error: 'Connection not found' });
    }
  });

  app.listen(port, () => {
    if (port !== DEFAULT_PORT) {
      logger.log(
        `Port ${DEFAULT_PORT} is already in use. MCP Server running on SSE at http://localhost:${port}`,
      );
    } else {
      logger.log(`MCP Server running on SSE at http://localhost:${port}`);
    }
  });

  return app;
}
