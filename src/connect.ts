import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import { detect } from 'detect-port';

const DEFAULT_PORT = 3001;
export async function connectServer(server: Server): Promise<express.Application> {
    const app = express();
    const port = await detect(DEFAULT_PORT);

    let currentTransport: SSEServerTransport | null = null;

    app.get('/sse', async (req: Request, res: Response) => {
        currentTransport = new SSEServerTransport('/messages', res);
        await server.connect(currentTransport);
    });

    app.post('/messages', async (req: Request, res: Response) => {
        // Note: In a production environment, you would need to implement
        // proper transport routing for multiple connections
        if (currentTransport) {
            try {
                await currentTransport.handlePostMessage(req, res);
            } catch (error) {
                console.error('Error handling POST message:', error);
                res.status(500).json({ error: 'Error handling POST message' });
            }
        } else {
            res.status(400).json({ error: 'No active SSE connection' });
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