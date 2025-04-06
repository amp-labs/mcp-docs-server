import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { detect } from 'detect-port';

class TransportManager {
    private transports: Map<string, SSEServerTransport>;
    private connectionCounter: number;

    constructor() {
        this.transports = new Map();
        this.connectionCounter = 0;
    }

    addTransport(transport: SSEServerTransport, res: Response): string {
        const connectionId = `connection-${++this.connectionCounter}`;
        this.transports.set(connectionId, transport);
        
        // Set up cleanup when response ends
        res.on('close', () => {
            this.removeTransport(connectionId);
        });
        
        return connectionId;
    }

    removeTransport(connectionId: string) {
        if (this.transports.has(connectionId)) {
            this.transports.delete(connectionId);
        }
    }

    getTransport(connectionId: string): SSEServerTransport | undefined {
        return this.transports.get(connectionId);
    }

    getAllTransports(): SSEServerTransport[] {
        return Array.from(this.transports.values());
    }
}

const DEFAULT_PORT = 3001;
export async function connectServer(server: Server): Promise<express.Application> {
    const app = express();
    const port = await detect(DEFAULT_PORT);
    const transportManager = new TransportManager();

    // Increase JSON payload limit to handle larger messages
    app.use(express.json({ limit: '10mb' }));

    app.get('/sse', async (req: Request, res: Response) => {
        try {
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            const transport = new SSEServerTransport('/messages', res);
            const connectionId = transportManager.addTransport(transport, res);
            
            // Set connection ID in response header
            res.setHeader('X-Connection-Id', connectionId);
            
            await server.connect(transport);
        } catch (error) {
            console.error('Error establishing SSE connection:', error);
            res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
    });

    app.post('/messages', async (req: Request, res: Response) => {
        const connectionId = req.headers['x-connection-id'] as string;
        
        if (!connectionId) {
            res.status(400).json({ error: 'Missing connection ID header' });
            return;
        }

        const transport = transportManager.getTransport(connectionId);
        
        if (transport) {
            try {
                await transport.handlePostMessage(req, res);
            } catch (error) {
                console.error('Error handling POST message:', error);
                res.status(500).json({ error: 'Error handling POST message' });
                
                // If there's a critical error, clean up the transport
                if (error instanceof Error && error.message.includes('connection closed')) {
                    transportManager.removeTransport(connectionId);
                }
            }
        } else {
            res.status(404).json({ error: 'Connection not found' });
        }
    });

    app.listen(port, () => {
        if(port !== DEFAULT_PORT) {
            console.error(`Port ${DEFAULT_PORT} is already in use. MCP Server running on SSE at http://localhost:${port}`);
        } else {
            console.error(`MCP Server running on SSE at http://localhost:${port}`);
        }
    });

    return app;
} 