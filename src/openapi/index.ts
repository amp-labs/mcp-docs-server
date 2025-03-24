import { validate } from '@mintlify/openapi-parser';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import axios, { isAxiosError } from 'axios';
import dashify from 'dashify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertEndpointToCategorizedZod, convertStrToTitle, findNextIteration, getEndpointsFromOpenApi, loadEnv } from './helpers.js';
import { Endpoint, ToolResponse, ZodSchemas } from './types';

export async function createToolsFromOpenApi(server: Server): Promise<void> {
    let openapi: string;
    try {
        const dirname = path.dirname(fileURLToPath(import.meta.url));
        openapi = fs.readFileSync(path.join(dirname, 'openapi.json'), 'utf8');
    } catch (error) {
        console.error('No OpenAPI file found, skipping tool creation');
        // No OpenAPI file found, skip
        return;
    }

    const { valid, errors, specification } = await validate(openapi);
    if (!valid || !specification) {
        console.error('Invalid OpenAPI file:', errors);
        return;
    }

    const endpoints = getEndpointsFromOpenApi(specification);
    const envVars = loadEnv();
    const existingTools = new Set<string>();

    endpoints.forEach((endpoint: Endpoint) => {
        const {
            url: urlSchema,
            method: methodSchema,
            paths: pathsSchema,
            queries: queriesSchema,
            body: bodySchema,
            headers: headersSchema,
            cookies: cookiesSchema,
        } = convertEndpointToCategorizedZod(endpoint);

        const serverArgumentsSchemas: ZodSchemas = {
            ...pathsSchema,
            ...queriesSchema,
            ...bodySchema,
            ...headersSchema,
            ...cookiesSchema,
        };

        if (!endpoint.title) {
            endpoint.title = `${endpoint.method} ${convertStrToTitle(endpoint.path)}`;
        }

        if (existingTools.has(endpoint.title)) {
            const lastCount = findNextIteration(existingTools, endpoint.title);
            endpoint.title = `${endpoint.title}---${lastCount}`;
        }

        if (endpoint.title.length > 64) {
            endpoint.title = endpoint.title.slice(0, -64);
        }

        existingTools.add(endpoint.title);

        // @ts-ignore
        server.tool(
            dashify(endpoint.title),
            endpoint.description || endpoint.title,
            serverArgumentsSchemas,
            async (inputArgs: any): Promise<ToolResponse> => {
                const inputParams: Record<string, any> = {};
                const inputHeaders: Record<string, string> = {};
                const inputCookies: Record<string, string> = {};
                let urlWithPathParams = urlSchema;
                let inputBody: any = undefined;

                if ('body' in inputArgs) {
                    inputBody = inputArgs.body;
                    delete inputArgs.body;
                }

                Object.entries(inputArgs).forEach(([key, value]) => {
                    if (key in pathsSchema) {
                        urlWithPathParams = urlWithPathParams.replace(`{${key}}`, value as string);
                    } else if (key in queriesSchema) {
                        inputParams[key] = value;
                    } else if (key in headersSchema) {
                        inputHeaders[key] = value as string;
                    } else if (key in cookiesSchema) {
                        inputCookies[key] = value as string;
                    }
                });

                if (endpoint.request.security.length > 0) {
                    const securityParams = endpoint.request.security[0]?.parameters;
                    if (securityParams) {
                        Object.entries(securityParams.query).forEach(([key, value]) => {
                            let envKey = '';
                            if (value.type === 'apiKey') {
                                envKey = `query_${key}_APIKEY`;
                            } else if (value.type === 'http') {
                                envKey = `query_${key}_HTTP_${value.scheme}`;
                            }
                            if (envKey && envKey in envVars) {
                                inputParams[key] = envVars[envKey];
                            }
                        });

                        Object.entries(securityParams.header).forEach(([key, value]) => {
                            let envKey = '';
                            if (value.type === 'apiKey') {
                                envKey = `header_${key}_APIKEY`;
                            } else if (value.type === 'http') {
                                envKey = `header_${key}_HTTP_${value.scheme}`;
                                if (value.scheme === 'bearer' && envKey in envVars) {
                                    inputHeaders['Authorization'] = `Bearer ${envVars[envKey]}`;
                                    return;
                                }
                            }
                            if (envKey && envKey in envVars) {
                                inputHeaders[key] = envVars[envKey];
                            }
                        });

                        Object.entries(securityParams.cookie).forEach(([key, value]) => {
                            let envKey = '';
                            if (value.type === 'apiKey') {
                                envKey = `cookie_${key}_APIKEY`;
                            } else if (value.type === 'http') {
                                envKey = `cookie_${key}_HTTP_${value.scheme}`;
                            }
                            if (envKey && envKey in envVars) {
                                inputCookies[key] = envVars[envKey];
                            }
                        });
                    }
                }

                try {
                    const response = await axios({
                        url: urlWithPathParams,
                        method: methodSchema,
                        params: inputParams,
                        data: inputBody,
                        headers: inputHeaders,
                    });

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(response.data, undefined, 2),
                            },
                        ],
                    };
                } catch (error) {
                    const errMsg = JSON.stringify(error, undefined, 2);
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: isAxiosError(error) ? `${error.message}\n\n${errMsg}` : errMsg,
                            },
                        ],
                    };
                }
            }
        );
    });
} 