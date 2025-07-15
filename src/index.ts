import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { connectServer } from './connect';
import { initialize } from './initialize';
import { createSearchTool } from './search';
import express from 'express';

const args = process.argv.slice(2);
const useStdioTransport =
  args.includes('--transport') && args[args.indexOf('--transport') + 1] === 'stdio';

async function main(): Promise<express.Application | undefined> {
  // @ts-expect-error - initialize() returns unknown type, needs casting
  const server = initialize() as Server;
  await createSearchTool(server);
  const app = connectServer(server, useStdioTransport);
  return app;
}

let mcpApp: Promise<express.Application | undefined> | null = null;

try {
  mcpApp = main();
} catch (error: any) {
  console.error('Fatal error in trying to initialize MCP server: ', error);
  process.exit(1);
}

export { mcpApp };
