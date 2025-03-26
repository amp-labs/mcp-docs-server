import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { connectServer } from './connect';
import { initialize } from './initialize';
import { createSearchTool } from './search';
import { createProxyTool } from './proxy';
import { createAuthTool } from './oAuth';
import { createWriteTool } from './write';
import express from 'express';

async function main(): Promise<express.Application> {
    // @ts-ignore
    const server = initialize() as Server;
    await createSearchTool(server);
    await createProxyTool(server, 'hubspot');
    await createAuthTool(server, 'hubspot');
    await createWriteTool(server, 'hubspot');
    const app = connectServer(server);
    return app;
}

let mcpApp: Promise<express.Application> | null = null;

try {
    mcpApp = main();
} catch (error: any) {
    console.error('Fatal error in trying to initialize MCP server: ', error);
    process.exit(1);
}

export { mcpApp };