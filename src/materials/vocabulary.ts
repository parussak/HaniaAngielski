import type { Course, Meaning } from './model.ts';
import type { Word } from '../learning/model.ts';
import { languageCode, object, text, texts } from './validation.ts';
import { legacyTargetLanguage } from './legacy.ts';
import { normalizeAnswer } from '../answers.ts';

export function compileVocabulary(input: unknown, metadata: { language: string; languageCode?: string; explanationLanguageCode?: string }, course?: Course): { words: Word[]; meanings: Meaning[] } {
    const target = course?.targetLanguage ?? legacyTargetLanguage(metadata);
    const explanation = course?.explanationLanguage ?? metadata.explanationLanguageCode ?? 'pl';
    const fail = (): never => { throw new Error('Niepoprawne znaczenia lub brak wariantu językowego słownictwa.'); };
    if (Array.isArray(input)) {
        if (!input.every(w => object(w) && text(w.id) && text(w.front) && text(w.back))) return fail();
        const words = structuredClone(input) as Word[];
        const meanings: Meaning[] = words.map(w => ({ id: w.id, source: w.source ?? '',
            ...(w.group === undefined ? {} : { group: w.group }), ...(w.rev === undefined ? {} : { rev: w.rev }),
            ...(w.illustration === undefined ? {} : { illustration: structuredClone(w.illustration) }),
            variants: { [explanation]: { text: w.front }, [target]: { text: w.back } },
            ...(w.answers === undefined ? {} : { answers: { [target]: [...w.answers] } }),
        }));
        return { words, meanings };
    }
    if (!object(input) || input.version !== 2 || !Array.isArray(input.entries) || !input.entries.length) return fail();
    const entries = input.entries;
    for (const entry of entries) {
        if (!object(entry) || !text(entry.id) || !text(entry.source) || !object(entry.variants) || !object(entry.illustration) ||
            entry.rev !== undefined && (!Number.isSafeInteger(entry.rev) || (entry.rev as number) < 1) || entry.group !== undefined && !text(entry.group)) return fail();
        for (const [language, variant] of Object.entries(entry.variants)) {
            if (!languageCode(language) || !object(variant) || !text(variant.text) ||
                variant.forms !== undefined && !texts(variant.forms) || variant.examples !== undefined && !texts(variant.examples)) return fail();
        }
        if (!object(entry.variants[target]) || !object(entry.variants[explanation])) return fail();
        if (entry.answers !== undefined) {
            if (!object(entry.answers)) return fail();
            for (const [language, answers] of Object.entries(entry.answers)) {
                const variant = entry.variants[language];
                if (!languageCode(language) || !object(variant) || !texts(answers) ||
                    new Set(answers.map(a => normalizeAnswer(a))).size !== answers.length ||
                    !answers.some(a => normalizeAnswer(a) === normalizeAnswer(variant.text as string))) return fail();
            }
        }
    }
    if (new Set(entries.map(e => (e as Meaning).id)).size !== entries.length) return fail();
    const meanings = structuredClone(entries) as unknown as Meaning[];
    const words = meanings.map(entry => ({ id: entry.id, front: entry.variants[explanation].text, back: entry.variants[target].text,
        source: entry.source, illustration: entry.illustration,
        ...(entry.group === undefined ? {} : { group: entry.group }), ...(entry.rev === undefined ? {} : { rev: entry.rev }),
        ...(entry.answers?.[target] === undefined ? {} : { answers: [...entry.answers[target]] }),
    }));
    return { words, meanings };
}
