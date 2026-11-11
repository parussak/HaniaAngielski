import {legacyCourse} from '../materials/identity.ts';
import type { Module } from './model.ts';
import { legacyTargetLanguage, legacyTranslationPrompt } from '../materials/legacy.ts';

// Legacy files keep their identifiers. New textbooks declare a distinct courseId.
export const courseKey = (module: Module) => module.courseId ?? `legacy-${module.id}`;
export function courseForModule(modules:Module[],id:string){const m=modules.find(m=>m.id===id);return m?courseKey(m):legacyCourse;}
export const sameCourse = (a: Module, b: Module) => courseKey(a) === courseKey(b);
export const compareModules = (a: Module, b: Module) => (a.courseOrder ?? a.order) - (b.courseOrder ?? b.order) || a.order - b.order;
export function targetLanguage(module: Module) {
    return module.languageCode ?? legacyTargetLanguage(module);
}
export function translationPrompt(module: Module) {
    return module.instructions?.translationPrompt ?? legacyTranslationPrompt(module);
}
