import { keyFor, type Module, type Progress, type Session } from './model.ts';
export function score(s: Session) { return { total: s.attempts.length, correct: s.attempts.filter(a => a.first).length, corrections: s.attempts.filter(a => a.corrected).length }; }
export function currentStats(modules: Module[], progress: Progress) {
    const wordKeys = new Set(modules.flatMap(m => m.words.map(w => keyFor(m, 'word', w.id))));
    const exerciseKeys = new Set(modules.flatMap(m => m.exercises.map(q => keyFor(m, 'exercise', q.id))));
    const keys = new Set([...wordKeys, ...exerciseKeys]);
    const review = new Set([...progress.difficult, ...Object.entries(progress.words).filter(([, v]) => v === 'review').map(([key]) => key)].filter(k => keys.has(k)));
    const attempts = progress.sessions.flatMap(s => s.attempts).filter(a => keys.has(a.key));
    const archived = Object.entries(progress.history?.items ?? {}).filter(([key]) => keys.has(key)).map(([, v]) => v);
    const total = attempts.length + archived.reduce((n, v) => n + v.total, 0), correct = attempts.filter(a => a.first).length + archived.reduce((n, v) => n + v.correct, 0);
    return { known: Object.entries(progress.words).filter(([key, value]) => wordKeys.has(key) && value === 'known').length, review: review.size, total, accuracy: total ? Math.round(correct / total * 100) : null };
}
