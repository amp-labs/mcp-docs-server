// @ts-nocheck
import { OpenApiToEndpointConverter } from '@mintlify/validation';
import dotenv from 'dotenv';
import { z } from 'zod';
import { dataSchemaArrayToZod, dataSchemaToZod } from './zod.js';
import { CategorizedZodSchemas, Endpoint, ZodSchemas } from './types';

export function convertStrToTitle(str: string): string {
    const spacedString = str.replace(/[-_]/g, ' ');
    const words = spacedString.split(/(?=[A-Z])|\s+/);
    const titleCasedWords = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    return titleCasedWords.join(' ');
}

export function findNextIteration(set: Set<string>, str: string): number {
    let count = 1;
    set.forEach((val) => {
        if (val.startsWith(`${str}---`)) {
            count = Number(val.replace(`${str}---`, ''));
        }
    });
    return count + 1;
}

export function getEndpointsFromOpenApi(specification: any): Endpoint[] {
    const endpoints: Endpoint[] = [];
    const paths = specification.paths;
    for (const path in paths) {
        const operations = paths[path];
        for (const method in operations) {
            if (method === 'parameters' || method === 'trace') {
                continue;
            }
            const endpoint = OpenApiToEndpointConverter.convert(specification, path, method as any, true);
            endpoints.push(endpoint);
        }
    }
    return endpoints;
}

export function loadEnv(): Record<string, string> {
    try {
        // First try loading from environment variables
        const envVars = process.env as Record<string, string>;
        if (Object.keys(envVars).length > 0) {
            envVars['header_X-Api-Key_APIKEY'] = envVars.AMPERSAND_API_KEY;
            return envVars;
        }

        // Fall back to .env file if no env vars
        const envPath = globalThis.path.join(globalThis.fileURLToPath(import.meta.url), '../../..', '.env');
        if (globalThis.fs.existsSync(envPath)) {
            const vars = dotenv.parse(globalThis.fs.readFileSync(envPath));
            vars['header_X-Api-Key_APIKEY'] = vars.AMPERSAND_API_KEY;
            return vars;
        }
    } catch (error) {
        // if there's no env, the user will be prompted
        // for their auth info at runtime if necessary
        // (shouldn't happen either way)
    }
    return {};
}

function convertParameterSection(parameters: Record<string, any>, paramSection: ZodSchemas): void {
    Object.entries(parameters).forEach(([key, value]) => {
        const schema = value.schema;
        paramSection[key] = dataSchemaArrayToZod(schema);
    });
}

function convertParametersAndAddToRelevantParamGroups(
    parameters: {
        path: Record<string, any>;
        query: Record<string, any>;
        header: Record<string, any>;
        cookie: Record<string, any>;
    },
    paths: ZodSchemas,
    queries: ZodSchemas,
    headers: ZodSchemas,
    cookies: ZodSchemas
): void {
    convertParameterSection(parameters.path, paths);
    convertParameterSection(parameters.query, queries);
    convertParameterSection(parameters.header, headers);
    convertParameterSection(parameters.cookie, cookies);
}

function convertSecurityParameterSection(
    securityParameters: Record<string, any>,
    securityParamSection: ZodSchemas,
    envVariables: Record<string, string>,
    location: string
): void {
    Object.entries(securityParameters).forEach(([key, value]) => {
        if (value.type === 'oauth2') {
            return;
        }
        let envKey: string;
        if (value.type === 'apiKey') {
            envKey = `${location}_${key}_APIKEY`;
        } else {
            envKey = `${location}_${key}_HTTP_${value.scheme}`;
        }
        if (envKey && !(envKey in envVariables)) {
            securityParamSection[key] = z.string();
        }
    });
}

function convertSecurityParametersAndAddToRelevantParamGroups(
    securityParameters: {
        query: Record<string, any>;
        header: Record<string, any>;
        cookie: Record<string, any>;
    },
    queries: ZodSchemas,
    headers: ZodSchemas,
    cookies: ZodSchemas,
    envVariables: Record<string, string>
): void {
    convertSecurityParameterSection(securityParameters.query, queries, envVariables, 'query');
    convertSecurityParameterSection(securityParameters.header, headers, envVariables, 'header');
    convertSecurityParameterSection(securityParameters.cookie, cookies, envVariables, 'cookie');
}

export function convertEndpointToCategorizedZod(endpoint: Endpoint): CategorizedZodSchemas {
    const envVariables = loadEnv();
    const url = `${endpoint.servers?.[0]?.url || ''}${endpoint.path}`;
    const method = endpoint.method;
    const paths: ZodSchemas = {};
    const queries: ZodSchemas = {};
    const headers: ZodSchemas = {};
    const cookies: ZodSchemas = {};
    let body: ZodSchemas | undefined = undefined;

    convertParametersAndAddToRelevantParamGroups(endpoint.request.parameters, paths, queries, headers, cookies);

    if (endpoint.request.security[0]?.parameters) {
        convertSecurityParametersAndAddToRelevantParamGroups(
            endpoint.request.security[0].parameters,
            queries,
            headers,
            cookies,
            envVariables
        );
    }

    const jsonBodySchema = endpoint.request.body['application/json'];
    const bodySchemaArray = jsonBodySchema?.schemaArray;
    const bodySchema = bodySchemaArray?.[0];

    if (bodySchema) {
        const zodBodySchema = dataSchemaToZod(bodySchema);
        body = { body: zodBodySchema };
    }

    return { url, method, paths, queries, body, headers, cookies };
} 