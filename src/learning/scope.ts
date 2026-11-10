import type { Module } from './model.ts';

// Legacy files keep their identifiers. New textbooks declare a distinct courseId.
export const courseKey = (module: Module) => module.courseId ?? `legacy:${module.language}`;
export const sameCourse = (a: Module, b: Module) => courseKey(a) === courseKey(b);
export function targetLanguage(module: Module) {
    return module.languageCode ?? ({ Angielski: 'en', Francuski: 'fr', Włoski: 'it' }[module.language] ?? '');
}
export function translationPrompt(module: Module) {
    return ({ en: 'Podaj po angielsku', fr: 'Podaj po francusku', it: 'Podaj po włosku' }[targetLanguage(module)] ?? `Podaj w języku: ${module.language}`);
}
