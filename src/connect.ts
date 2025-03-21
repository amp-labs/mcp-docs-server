import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export async function connectServer(server: Server): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Server running on stdio');
} 