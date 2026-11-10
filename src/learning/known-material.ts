import type { Module, Progress } from './model.ts';
import { keyFor } from './model.ts';
import { sameCourse } from './scope.ts';

export interface AnswerHistory { total: number; correct: number; last: number }
/** Historical totals already include archived attempts; do not read them twice. */
export function answerHistory(p: Progress) {
    const counts = new Map<string, AnswerHistory>();
    for (const [key, value] of Object.entries(p.history?.items ?? {})) counts.set(key, { ...value, last: 0 });
    for (const session of [...p.sessions, ...(p.active ? [p.active] : [])]) for (const attempt of session.attempts) {
        const old = counts.get(attempt.key) ?? { total: 0, correct: 0, last: 0 };
        counts.set(attempt.key, { total: old.total + 1, correct: old.correct + Number(attempt.first), last: Math.max(old.last, Date.parse(session.completedAt ?? session.startedAt) || 0) });
    }
    return counts;
}

export function knownMaterial(modules: Module[], anchor: Module, p: Progress) {
    const counts = answerHistory(p), remembered = new Set(p.encountered ?? []), words = new Set<string>(), exercises = new Set<string>();
    const seen = (key: string) => remembered.has(key) || !!counts.get(key)?.total;
    for (const m of modules.filter(m => sameCourse(m, anchor))) {
        for (const w of m.words) if (seen(keyFor(m, 'word', w.id))) words.add(keyFor(m, 'word', w.id));
        for (const q of m.exercises) if (seen(keyFor(m, 'exercise', q.id))) {
            exercises.add(keyFor(m, 'exercise', q.id));
            if (q.kind === 'vocabulary' && q.wordId && m.words.some(w => w.id === q.wordId)) words.add(keyFor(m, 'word', q.wordId));
        }
    }
    return { words, exercises, counts };
}
