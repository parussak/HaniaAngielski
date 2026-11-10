import type { Course } from './model.ts';

// Compatibility at the input boundary only. New courses declare language codes
// and instructions in their files; the session engine has no language table.
export const legacyTargetLanguage = (metadata: { languageCode?: string; language: string }) => metadata.languageCode ?? ({ Angielski: 'en', Francuski: 'fr', Włoski: 'it' }[metadata.language] ?? 'und');
export function legacyTranslationPrompt(metadata: { languageCode?: string; language: string }) {
    return ({ en: 'Podaj po angielsku', fr: 'Podaj po francusku', it: 'Podaj po włosku' }[legacyTargetLanguage(metadata)] ?? `Podaj w języku: ${metadata.language}`);
}

export function legacyCourses(metadata: { id: string; name: string; language: string; languageCode?: string; courseId?: string; order: number }[]): Course[] {
    const groups = new Map<string, typeof metadata>();
    for (const m of metadata) {
        // Same language alone is not evidence of using the same textbook.
        const id = m.courseId ?? `legacy-${m.id}`;
        groups.set(id, [...(groups.get(id) ?? []), m]);
    }
    return [...groups].map(([id, modules]) => ({ id, name: modules[0].name,
        targetLanguage: legacyTargetLanguage(modules[0]), explanationLanguage: 'pl',
        textbook: { title: null, authors: null, edition: null }, levels: null,
        moduleIds: [...modules].sort((a, b) => a.order - b.order).map(m => m.id),
        instructions: { translationPrompt: legacyTranslationPrompt(modules[0]), wordExplanationTemplate: '„{answer}” oznacza „{cue}”.' },
    }));
}
