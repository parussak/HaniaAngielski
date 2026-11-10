import type { Course, MaterialCatalog } from './model.ts';

export const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const texts = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(text);
export const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
export function languageCode(v: unknown): v is string {
    if (typeof v !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(v)) return false;
    try { return Intl.getCanonicalLocales(v)[0] === v; } catch { return false; }
}
const unique = (v: string[]) => new Set(v).size === v.length;

export function validateCatalog(input: unknown): MaterialCatalog {
    if (!object(input) || input.version !== 1 || !Array.isArray(input.modules) || !input.modules.length || !input.modules.every(identifier) || !unique(input.modules) ||
        input.coursesFile !== undefined && (typeof input.coursesFile !== 'string' || !/^[a-z0-9-]+\.json$/.test(input.coursesFile)))
        throw new Error('Niepoprawny katalog materiałów.');
    return structuredClone(input) as unknown as MaterialCatalog;
}

export function validateCourses(input: unknown): Course[] {
    const fail = (): never => { throw new Error('Niepoprawny opis kursów lub podręcznika.'); };
    if (!object(input) || input.version !== 1 || !Array.isArray(input.courses) || !input.courses.length) return fail();
    for (const c of input.courses) {
        if (!object(c) || !identifier(c.id) || !text(c.name) || !languageCode(c.targetLanguage) || !languageCode(c.explanationLanguage) ||
            !object(c.textbook) || !(c.textbook.title === null || text(c.textbook.title)) || !(c.textbook.edition === null || text(c.textbook.edition)) ||
            !(c.textbook.authors === null || texts(c.textbook.authors)) ||
            !(c.levels === null || texts(c.levels) && unique(c.levels) && c.levels.every(level => ['A1','A2','B1','B2','C1','C2'].includes(level))) ||
            !Array.isArray(c.moduleIds) || !c.moduleIds.length || !c.moduleIds.every(identifier) || !unique(c.moduleIds) ||
            !object(c.instructions) || !text(c.instructions.translationPrompt) || !text(c.instructions.wordExplanationTemplate) ||
            !c.instructions.wordExplanationTemplate.includes('{answer}') || !c.instructions.wordExplanationTemplate.includes('{cue}')) return fail();
    }
    if (!unique(input.courses.map(c => (c as unknown as Course).id))) return fail();
    const ids = input.courses.flatMap(c => (c as unknown as Course).moduleIds);
    if (!unique(ids)) return fail();
    return structuredClone(input.courses) as unknown as Course[];
}
