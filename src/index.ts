import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { connectServer } from './connect';
import { initialize } from './initialize';
import { createProxyTool } from './proxy';
import { createAuthTool } from './oAuth';
import { createWriteTool } from './write';
import express from 'express';
import { createConnectionManagerTools } from './connectionManager';

async function main(): Promise<express.Application> {
    // @ts-ignore
    const server = initialize() as Server;
    // await createSearchTool(server);
    // TODO: Figure out a way to get unique group ref for each mcp client.
    // TODO: Need a way to detect connection status.  
    // NOTE: We can potentially loop through all the providers and create tools for each one here.
    await createAuthTool(server, 'hubspot');
    await createProxyTool(server, 'hubspot');
    await createConnectionManagerTools(server, 'hubspot');
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