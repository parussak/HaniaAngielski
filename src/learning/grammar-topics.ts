import type { AnswerMode, GrammarRule, GrammarTopic, Item, Module, Progress, Session } from './model.ts';
import { keyFor } from './model.ts';
import { coursePracticePool, makeCoursePracticeSession } from './course-practice.ts';
import { journeyKey, lessons, type Journey, type Lesson } from './journey.ts';
import { knownMaterial } from './known-material.ts';
import { compareModules, sameCourse } from './scope.ts';

/** D-74: where a rule is practised; the lesson list is derived from `ruleIds`, never copied. */
export interface GrammarLessonRef { moduleId: string; journeyKey: string; lessonId: string; title: string }
export interface GrammarRuleEntry { rule: GrammarRule; moduleId: string; attempts: number; correct: number; lessons: GrammarLessonRef[] }
export interface GrammarTopicEntry { topic: GrammarTopic; rules: GrammarRuleEntry[]; attempts: number; correct: number }

const ruleRef = (moduleId: string, ruleId: string) => `${moduleId}/${ruleId}`;

/**
 * Topics of the course that the learner has already touched: a topic (and each
 * of its rules) shows up only after a first attempt at one of its grammar
 * exercises, so later modules do not give away material that is still ahead.
 */
export function grammarTopics(modules: Module[], anchor: Module, topics: GrammarTopic[], journeys: Journey[], p: Progress): GrammarTopicEntry[] {
    const own = modules.filter(m => sameCourse(m, anchor)).sort(compareModules);
    const { counts } = knownMaterial(modules, anchor, p);
    const result: GrammarTopicEntry[] = [];
    for (const topic of topics) {
        const rules: GrammarRuleEntry[] = [];
        for (const m of own) for (const rule of m.grammar) {
            if (rule.grammarTopicId !== topic.id) continue;
            let attempts = 0, correct = 0;
            for (const q of m.exercises) {
                if (q.kind !== 'grammar' || q.ruleId !== rule.id) continue;
                const history = counts.get(keyFor(m, 'exercise', q.id));
                if (history) { attempts += history.total; correct += history.correct; }
            }
            if (!attempts) continue;
            const refs: GrammarLessonRef[] = [];
            for (const journey of journeys) {
                if (journey.moduleId !== m.id) continue;
                for (const { lesson } of lessons(journey)) {
                    // D-52: the current content of a lesson is its `update`, when it has one.
                    const current = lesson.update ?? lesson;
                    if (current.ruleIds.includes(rule.id)) refs.push({ moduleId: m.id, journeyKey: journeyKey(journey), lessonId: lesson.id, title: current.title });
                }
            }
            rules.push({ rule, moduleId: m.id, attempts, correct, lessons: refs });
        }
        if (rules.length) result.push({ topic, rules, attempts: rules.reduce((n, r) => n + r.attempts, 0), correct: rules.reduce((n, r) => n + r.correct, 0) });
    }
    return result;
}

/** Tried grammar exercises of the given topics; rule ids repeat between modules, so rules are matched by module too. */
export function grammarTopicPool(modules: Module[], anchor: Module, p: Progress, topicIds: string | string[]): Item[] {
    const topics = new Set(typeof topicIds === 'string' ? [topicIds] : topicIds);
    const wanted = new Set(modules.filter(m => sameCourse(m, anchor)).flatMap(m => m.grammar.filter(r => r.grammarTopicId && topics.has(r.grammarTopicId)).map(r => ruleRef(m.id, r.id))));
    return coursePracticePool(modules, anchor, p, 'grammar').filter(item => {
        const q = modules.find(m => m.id === item.moduleId)?.exercises.find(q => q.id === item.id);
        return !!q?.ruleId && wanted.has(ruleRef(item.moduleId, q.ruleId));
    });
}

/** An ordinary course grammar session limited to one topic: the saved format does not change. */
export function makeGrammarTopicSession(modules: Module[], anchor: Module, p: Progress, topicIds: string | string[], answerMode: AnswerMode): Session | null {
    return makeCoursePracticeSession(modules, anchor, p, 'grammar', answerMode, grammarTopicPool(modules, anchor, p, topicIds));
}

/** Topics of the rules a lesson teaches (its current content, D-52); empty for lessons without rules. */
export function lessonTopicIds(module: Module, lesson: Lesson): string[] {
    const ruleIds = (lesson.update ?? lesson).ruleIds;
    return [...new Set(module.grammar.filter(r => ruleIds.includes(r.id) && r.grammarTopicId).map(r => r.grammarTopicId!))];
}
