export const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 2000;
export const date = (v: unknown): boolean => str(v) && Number.isFinite(Date.parse(v));
export const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 100000 && v.every(str);
export const integer = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
export const safeKey = (key: string) => str(key) && !['__proto__', 'prototype', 'constructor'].includes(key);
export const identifiers=(v:unknown)=>strings(v)&&new Set(v).size===v.length&&v.every(id=>/^[a-z0-9-]+$/.test(id)&&safeKey(id));
export const totals = (v: unknown) => obj(v) && integer(v.total) && integer(v.correct) && (v.correct as number) <= (v.total as number);
