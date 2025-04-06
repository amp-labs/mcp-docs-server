import { HttpFunction } from '@google-cloud/functions-framework';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { connectServer } from './connect';
import { initialize } from './initialize';
import { createToolsFromOpenApi } from './openapi/index';
import { createSearchTool } from './search';
import express from 'express';

async function createApp(): Promise<express.Application> {
    // @ts-ignore
    const server = initialize() as Server;
    await createSearchTool(server);
    await createToolsFromOpenApi(server);
    const app = connectServer(server);
    return app;
}

let mcpApp: express.Application | null = null;

// Cloud Function entry point
export const mcpDocsServer = async (req: any, res: any) => {
    try {
        if (!mcpApp) {
            mcpApp = await createApp();
        }
        // Forward the request to the Express app
        return mcpApp(req, res);
    } catch (error: any) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
};