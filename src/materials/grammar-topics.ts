import type { Module } from '../learning/model.ts';
import type { Course, GrammarTopic } from './model.ts';
import { identifier, object, text } from './validation.ts';

/** D-74: reads the list of grammar topics of one course. */
export function validateGrammarTopics(input: unknown): GrammarTopic[] {
    const fail = (): never => { throw new Error('Niepoprawny plik tematów gramatyki.'); };
    if (!Array.isArray(input) || !input.length) return fail();
    for (const t of input) if (!object(t) || !identifier(t.id) || !text(t.title) || t.summary !== undefined && !text(t.summary)) return fail();
    if (new Set(input.map(t => (t as GrammarTopic).id)).size !== input.length) return fail();
    return structuredClone(input) as GrammarTopic[];
}

/**
 * D-74: every rule of a course has a topic and at least one grammar exercise.
 * Topics are required only for courses that declare `grammarTopicsFile`, so
 * content without topics keeps working until a course opts in. A topic
 * without rules is allowed: modules of a course may be loaded in part.
 */
export function checkGrammarTopics(course: Course, modules: Module[]) {
    const fail = (message: string): never => { throw new Error(`Błąd gramatyki kursu ${course.id}: ${message}`); };
    const own = modules.filter(m => course.moduleIds.includes(m.id));
    const topics = course.grammarTopics;
    for (const m of own) for (const rule of m.grammar) {
        if (!m.exercises.some(q => q.kind === 'grammar' && q.ruleId === rule.id)) fail(`reguła ${m.id}/${rule.id} nie ma żadnego zadania gramatycznego.`);
        if (!topics) { if (rule.grammarTopicId !== undefined) fail(`reguła ${m.id}/${rule.id} wskazuje temat, a kurs nie ma pliku tematów.`); continue; }
        if (!rule.grammarTopicId) fail(`reguła ${m.id}/${rule.id} nie ma tematu.`);
        if (!topics.some(t => t.id === rule.grammarTopicId)) fail(`reguła ${m.id}/${rule.id} wskazuje nieznany temat ${rule.grammarTopicId}.`);
    }
}
