import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function createAuthTool(server: Server, provider: string): Promise<void> {
    // @ts-ignore
    server.tool('oauth', `Connect to ${provider} using the Ampersand OAuth flow`, {
        query: z.string(),
    }, async ({ query }: { query: string }) => {
        const content = 'oauth tool'

        return {
            content,
        };
    });

    // @ts-ignore
    server.tool('api-key', `Connect to ${provider} using an API key`, {
        query: z.string(),
    }, async ({ query }: { query: string }) => {
        const content = 'api-key tool'

        return {
            content,
        };
    });
} 