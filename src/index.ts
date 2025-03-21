import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { connectServer } from './connect.js';
import { initialize } from './initialize.js';
import { createToolsFromOpenApi } from './openapi/index.js';
import { createSearchTool } from './search.js';

async function main(): Promise<void> {
    // @ts-ignore
    const server = initialize() as Server;
    await createSearchTool(server);
    await createToolsFromOpenApi(server);
    await connectServer(server);
}

main().catch((error: Error) => {
    console.error('Fatal error in trying to initialize MCP server: ', error);
    process.exit(1);
}); 