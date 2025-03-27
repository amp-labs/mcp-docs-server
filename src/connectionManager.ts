import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function createConnectionManagerTools(server: Server, provider: string): Promise<void> {
    // @ts-ignore
    server.tool('check-connection', `Check if the connection for ${provider} exists`, {
        query: z.string(),
    }, async ({ query }: { query: string }) => {
        const content = 'connection manager tool'

        return {
            content,
        };
    });
} 