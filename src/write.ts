import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function createWriteTool(server: Server, provider: string): Promise<void> {
    // @ts-ignore
    server.tool('write', `Write to ${provider}`, {
        query: z.string(),
    }, async ({ query }: { query: string }) => {
        const content = 'write tool'

        return {
            content,
        };
    });
}   