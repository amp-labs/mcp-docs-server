import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function createProxyTool(server: Server, provider: string): Promise<void> {
    // @ts-ignore
    server.tool('proxy', `Call ${provider} APIs via the Ampersand proxy`, {
        query: z.string(),
    }, async ({ query }: { query: string }) => {
        const content = 'proxy tool'

        return {
            content,
        };
    });
} 