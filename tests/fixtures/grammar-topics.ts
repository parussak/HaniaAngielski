import { readLibrary } from '../../src/materials/library.ts';
import type { Journey } from '../../src/learning/journey.ts';

/** Synthetic data for D-74 tests: not textbook material. Two courses so that isolation can be checked. */
export function grammarTopicsFixture() {
    const course = (id: string, lang: string, moduleIds: string[], topicsFile?: string) => ({
        id, name: `Test: ${id}`, targetLanguage: lang, explanationLanguage: 'pl',
        textbook: { title: 'Podręcznik testowy', authors: ['Autor testowy'], edition: '1' }, levels: ['A1'],
        moduleIds, instructions: { translationPrompt: 'Podaj', wordExplanationTemplate: '„{answer}” oznacza „{cue}”.' },
        ...(topicsFile ? { grammarTopicsFile: topicsFile } : {}),
    });
    const entries = [
        { id: 'coffee-drink', source: 'Materiał testowy', illustration: { symbol: '☕', caption: 'Napój kawowy' }, variants: { pl: { text: 'kawa' }, en: { text: 'coffee' }, fr: { text: 'café' } } },
        { id: 'water-drink', source: 'Materiał testowy', illustration: { symbol: '💧', caption: 'Woda' }, variants: { pl: { text: 'woda' }, en: { text: 'water' }, fr: { text: 'eau' } } },
    ];
    const rule = (id: string, topic?: string) => ({ id, title: `Reguła ${id}`, explanation: `Wyjaśnienie ${id}.`, examples: ['Przykład.'], source: 'Dane testowe', ...(topic ? { grammarTopicId: topic } : {}) });
    const exercise = (moduleId: string, id: string, ruleId: string) => ({ id, kind: 'grammar', prompt: `Zadanie ${id}`, answers: ['a'], options: ['a', 'b'], explanation: 'Bo tak.', requires: [moduleId], caseSensitive: false, source: 'Dane testowe', ruleId });
    const files: Record<string, unknown> = {
        'katalog.json': { version: 1, coursesFile: 'kursy.json', modules: ['en-1', 'en-2', 'fr-1'] },
        'kursy.json': { version: 1, courses: [course('english-book', 'en', ['en-unit-1', 'en-unit-2'], 'tematy-gramatyki/english-book.json'), course('french-book', 'fr', ['fr-unit-1'], 'tematy-gramatyki/french-book.json')] },
        'tematy-gramatyki/english-book.json': [{ id: 'present-continuous', title: 'Present Continuous', summary: 'Co dzieje się teraz.' }, { id: 'articles', title: 'Articles' }],
        'tematy-gramatyki/french-book.json': [{ id: 'passe', title: 'Passé composé' }],
    };
    const addModule = (folder: string, id: string, order: number, language: string, rules: ReturnType<typeof rule>[], exercises: ReturnType<typeof exercise>[]) => {
        files[`${folder}/modul.json`] = { id, version: 1, order, name: `Moduł ${id}`, subtitle: 'Dane testowe', language, source: 'Dane testowe', label: 'TEST', cover: 'Test', topics: ['Gramatyka'] };
        files[`${folder}/slownictwo.json`] = { version: 2, entries: structuredClone(entries) };
        files[`${folder}/quiz.json`] = [{ id: 'coffee-question', wordId: 'coffee-drink', distractorIds: ['water-drink'] }];
        files[`${folder}/cwiczenia.json`] = exercises;
        files[`${folder}/gramatyka.json`] = rules;
    };
    addModule('en-1', 'en-unit-1', 1, 'Angielski', [rule('pc-basic', 'present-continuous'), rule('art', 'articles')], [exercise('en-unit-1', 'g-pc-1', 'pc-basic'), exercise('en-unit-1', 'g-pc-2', 'pc-basic'), exercise('en-unit-1', 'g-art-1', 'art')]);
    addModule('en-2', 'en-unit-2', 2, 'Angielski', [rule('pc-more', 'present-continuous')], [exercise('en-unit-2', 'g-pcm-1', 'pc-more')]);
    addModule('fr-1', 'fr-unit-1', 1, 'Francuski', [rule('pc-basic', 'passe')], [exercise('fr-unit-1', 'g-fr-1', 'pc-basic')]);
    const lesson = (id: string, ruleIds: string[]) => ({ id, title: `Lekcja ${id}`, intro: 'Wstęp.', wordIds: [], exerciseIds: [], ruleIds });
    const journeys: Journey[] = [
        { version: 1, moduleId: 'en-unit-1', title: 'Mapa 1', stages: [{ id: 's1', title: 'Etap', cat: 'x', illustration: 'x', lessons: [lesson('l-pc', ['pc-basic']), lesson('l-art', ['art'])] }] },
        { version: 1, moduleId: 'en-unit-2', title: 'Mapa 2', stages: [{ id: 's2', title: 'Etap', cat: 'x', illustration: 'x', lessons: [lesson('l-more', ['pc-more'])] }] },
    ];
    const read = async (path: string) => {
        if (!(path in files)) throw new Error(`Brak pliku testowego: ${path}`);
        return structuredClone(files[path]);
    };
    return { files, journeys, read, library: () => readLibrary(read) };
}
