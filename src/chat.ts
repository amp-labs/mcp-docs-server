import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import axios from 'axios';
import { logger } from './logger.js';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatContext {
    messages: ChatMessage[];
    metadata?: Record<string, any>;
}

export async function createChatTool(server: Server): Promise<void> {
    // @ts-ignore
    server.tool('chat', 'Process chat messages and return intelligent responses', {
        message: z.string(),
        context: z.object({
            messages: z.array(z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string()
            })),
            metadata: z.record(z.any()).optional()
        })
    }, async ({ message, context }: { message: string; context: ChatContext }) => {
        try {
            // Add the new message to the context
            const updatedContext = {
                ...context,
                messages: [
                    ...context.messages,
                    { role: 'user', content: message }
                ]
            };

            // Here you would typically:
            // 1. Process the message and context
            // 2. Query relevant data sources
            // 3. Generate an intelligent response
            // 4. Return the response

            // For now, let's return a simple response
            const response = {
                type: 'text' as const,
                text: `I received your message: "${message}". I'm processing it with the context of ${context.messages.length} previous messages.`
            };

            return {
                content: [response],
                context: updatedContext
            };
        } catch (error) {
            logger.error('Error processing chat message:', error);
            throw new Error('Failed to process chat message');
        }
    });
} 