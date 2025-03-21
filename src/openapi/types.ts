import { z } from 'zod';

export interface SecurityParameter {
    type: 'apiKey' | 'http';
    scheme?: string;
}

export interface SecurityParameters {
    query: Record<string, SecurityParameter>;
    header: Record<string, SecurityParameter>;
    cookie: Record<string, SecurityParameter>;
}

export interface Security {
    parameters: SecurityParameters;
}

export interface Endpoint {
    path: string;
    method: string;
    title: string;
    description?: string;
    request: {
        security: Security[];
    };
}

export interface OpenAPIValidationResult {
    valid: boolean;
    errors?: any[];
    specification?: any;
}

export interface ZodSchemas {
    [key: string]: z.ZodType<any>;
}

export interface CategorizedZodSchemas {
    url: string;
    method: string;
    paths: ZodSchemas;
    queries: ZodSchemas;
    body: ZodSchemas;
    headers: ZodSchemas;
    cookies: ZodSchemas;
}

export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
} 