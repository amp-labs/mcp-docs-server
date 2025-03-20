import { Blob } from 'buffer';
import { z } from 'zod';
function panic(error) {
    throw error;
}
const WebFile = class File extends Blob {
    constructor(init, name = panic(new TypeError('File constructor requires name argument')), options = {}) {
        super(init, options);
        this._name = String(name).replace(/\//g, ':');
        this._lastModified = options.lastModified || Date.now();
    }
    get name() {
        return this._name;
    }
    get webkitRelativePath() {
        return '';
    }
    get lastModified() {
        return this._lastModified;
    }
    get [Symbol.toStringTag]() {
        return 'File';
    }
};
const File = typeof global.File === 'undefined' ? WebFile : global.File;
const ANY = z.any();
const ANY_OPT = ANY.optional();
const BOOLEAN = z.boolean();
const BOOLEAN_OPT = BOOLEAN.optional();
const DATE = z.coerce.date();
const DATE_OPT = DATE.optional();
const FILE = z.instanceof(File);
const FILE_OPT = FILE.optional();
const NULL = z.null();
const NULL_OPT = NULL.optional();
const RECORD = z.record(z.any());
const RECORD_WITH_DEFAULT = RECORD.default({});
const RECORD_OPT = RECORD.optional();
const STRING = z.string();
const NUMBER = z.number();
const INTEGER = z.number().int();
export function dataSchemaArrayToZod(schemas) {
    const firstSchema = dataSchemaToZod(schemas[0]);
    if (!schemas[1]) {
        return firstSchema;
    }
    const secondSchema = dataSchemaToZod(schemas[1]);
    const zodSchemas = [firstSchema, secondSchema];
    for (const schema of schemas.slice(2)) {
        zodSchemas.push(dataSchemaToZod(schema));
    }
    return z.union(zodSchemas).array();
}
function getEnumSchema(enumList, type) {
    const zodSchema = z.enum(enumList.map(String));
    if (type === 'string')
        return zodSchema;
    return zodSchema.transform(Number);
}
export function dataSchemaToZod(schema) {
    if (!('type' in schema) || Object.keys(schema).length === 0) {
        return schema.required ? ANY : ANY_OPT;
    }
    switch (schema.type) {
        case 'null':
            return schema.required ? NULL : NULL_OPT;
        case 'boolean':
            return schema.required ? BOOLEAN : BOOLEAN_OPT;
        case 'enum<string>':
            const strEnumSchema = getEnumSchema(schema.enum, 'string');
            return schema.required ? strEnumSchema : strEnumSchema.optional();
        case 'enum<number>':
        case 'enum<integer>':
            const numEnumSchema = getEnumSchema(schema.enum, 'number');
            return schema.required ? numEnumSchema : numEnumSchema.optional();
        case 'file':
            return schema.required ? FILE : FILE_OPT;
        case 'any':
            return schema.required ? ANY : ANY_OPT;
        case 'string':
            if ('enum' in schema && Array.isArray(schema.enum)) {
                return schema.required
                    ? z.enum(schema.enum)
                    : z.enum(schema.enum).optional();
            }
            if (schema.format === 'binary') {
                return schema.required ? FILE : FILE_OPT;
            }
            let stringSchema = STRING;
            if (schema.minLength !== undefined) {
                stringSchema = stringSchema.min(schema.minLength);
            }
            if (schema.maxLength !== undefined) {
                stringSchema = stringSchema.max(schema.maxLength);
            }
            if (schema.pattern !== undefined) {
                stringSchema = stringSchema.regex(new RegExp(schema.pattern));
            }
            switch (schema.format) {
                case 'email':
                    stringSchema = stringSchema.email();
                    break;
                case 'uri':
                case 'url':
                    stringSchema = stringSchema.url();
                    break;
                case 'uuid':
                    stringSchema = stringSchema.uuid();
                    break;
                case 'date-time':
                    return schema.required ? DATE : DATE_OPT;
            }
            return schema.required ? stringSchema : stringSchema.optional();
        case 'number':
        case 'integer':
            if ('enum' in schema && Array.isArray(schema.enum)) {
                const numEnumSchema = getEnumSchema(schema.enum, schema.type);
                return schema.required ? numEnumSchema : numEnumSchema.optional();
            }
            let numberSchema = schema.type === 'integer' ? INTEGER : NUMBER;
            if (schema.minimum !== undefined) {
                numberSchema = numberSchema.min(schema.minimum);
            }
            if (schema.maximum !== undefined) {
                numberSchema = numberSchema.max(schema.maximum);
            }
            if (schema.exclusiveMinimum !== undefined && schema.minimum !== undefined) {
                numberSchema = numberSchema.gt(schema.minimum);
            }
            if (schema.exclusiveMaximum !== undefined && schema.maximum !== undefined) {
                numberSchema = numberSchema.lt(schema.maximum);
            }
            return schema.required ? numberSchema : numberSchema.optional();
        case 'array':
            let itemSchema;
            let arraySchema = z.any().array();
            if (Array.isArray(schema.items)) {
                itemSchema = dataSchemaArrayToZod(schema.items);
                if (schema.items.length > 1) {
                    arraySchema = itemSchema;
                }
                else {
                    arraySchema = itemSchema.array();
                }
            }
            else {
                itemSchema = dataSchemaToZod(schema.items);
                arraySchema = itemSchema.array();
            }
            if (schema.minItems !== undefined) {
                arraySchema = arraySchema.min(schema.minItems);
            }
            if (schema.maxItems !== undefined) {
                arraySchema = arraySchema.max(schema.maxItems);
            }
            return schema.required ? arraySchema : arraySchema.optional();
        case 'object':
            const shape = {};
            const requiredProperties = schema.requiredProperties;
            const requiredPropertiesSet = new Set(requiredProperties !== null && requiredProperties !== void 0 ? requiredProperties : []);
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                const zodPropSchema = Array.isArray(propSchema)
                    ? dataSchemaArrayToZod(propSchema)
                    : dataSchemaToZod(propSchema);
                shape[key] = requiredPropertiesSet.has(key) ? zodPropSchema : zodPropSchema.optional();
            }
            if (Object.keys(shape).length === 0) {
                return schema.required ? RECORD_WITH_DEFAULT : RECORD_OPT;
            }
            return schema.required ? z.object(shape) : z.object(shape).optional();
        default:
            return ANY;
    }
}
