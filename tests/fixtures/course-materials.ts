import type { Course, Meaning } from '../../src/materials/model.ts';

/** Synthetic data for engine tests, not approved textbook material. */
export function courseFixture() {
    const course = (id: string, targetLanguage: string, moduleId: string, prompt: string): Course => ({
        id, name: `Test: ${id}`, targetLanguage, explanationLanguage: 'pl',
        textbook: { title: 'Podręcznik testowy', authors: ['Autor testowy'], edition: '1' }, levels: ['A1','A2'],
        moduleIds: [moduleId], instructions: { translationPrompt: prompt, wordExplanationTemplate: '„{answer}” oznacza „{cue}”.' },
    });
    const courses = [course('english-book', 'en', 'en-unit', 'Podaj po angielsku'), course('french-book', 'fr', 'fr-unit', 'Podaj po francusku'), course('italian-book', 'it', 'it-unit', 'Podaj po włosku')];
    const entries: Meaning[] = [
        { id: 'coffee-drink', source: 'Materiał testowy', illustration: { symbol: '☕', caption: 'Napój kawowy' },
            variants: { pl: { text: 'kawa' }, en: { text: 'coffee' }, fr: { text: 'café', forms: ['un café'], examples: ['Un café, s’il vous plaît.'] }, it: { text: 'caffè' } } },
        { id: 'water-drink', source: 'Materiał testowy', illustration: { symbol: '💧', caption: 'Woda' },
            variants: { pl: { text: 'woda' }, en: { text: 'water' }, fr: { text: 'eau' }, it: { text: 'acqua' } } },
    ];
    const files: Record<string, unknown> = { 'katalog.json': { version: 1, coursesFile: 'kursy.json', modules: ['english','french','italian'] }, 'kursy.json': { version: 1, courses } };
    for (const [i, folder] of ['english','french','italian'].entries()) {
        const c = courses[i];
        files[`${folder}/modul.json`] = { id: c.moduleIds[0], version: 1, order: 1, name: `Moduł ${c.id}`, subtitle: 'Dane testowe', language: { en: 'Angielski', fr: 'Francuski', it: 'Włoski' }[c.targetLanguage], source: 'Dane testowe', label: 'TEST', cover: 'Test', topics: ['Słownictwo'] };
        files[`${folder}/slownictwo.json`] = { version: 2, entries: structuredClone(entries) };
        files[`${folder}/quiz.json`] = [{ id: 'coffee-question', wordId: 'coffee-drink', distractorIds: ['water-drink'] }];
        files[`${folder}/cwiczenia.json`] = [];
        files[`${folder}/gramatyka.json`] = [];
    }
    return { files, courses, entries, read: async (path: string) => {
        if (!(path in files)) throw new Error(`Brak pliku testowego: ${path}`);
        return structuredClone(files[path]);
    } };
}
