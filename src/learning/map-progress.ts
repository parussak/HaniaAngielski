import {polishCount} from '../polish-count.ts';
import { lessons, lessonKey, type Journey, type Stage } from '../adventure.ts';
import type { Progress } from './model.ts';
import { reviewStats } from '../stage-review.ts';

export const exerciseCount = (n:number) => polishCount(n,'ćwiczenie','ćwiczenia','ćwiczeń');

export function mapProgress(j: Journey, p: Progress, stage?: Stage) {
    const keys = stage ? stage.lessons.map(l => lessonKey(j, l)) : lessons(j).map(l => l.key);
    const done = keys.filter(key => p.adventure?.completed[key]).length;
    const review = reviewStats(p, j, stage);
    const complete = keys.length > 0 && done === keys.length;
    const checking = !!p.adventure?.reviewArchiveHead;
    return { done, total: keys.length, percent: keys.length ? Math.floor(done / keys.length * 100) : 0, pending: review.pending, reviewed: review.total,
        complete, checking, mastered: complete && review.pending === 0 && !checking };
}

export function reviewProgressText(stats: ReturnType<typeof mapProgress>) {
    if (stats.pending) return `${exerciseCount(stats.pending)} do utrwalenia`;
    if (stats.checking) return 'Sprawdzamy starsze błędy';
    if (stats.mastered) return '0 ćwiczeń do utrwalenia · Gratulacje!';
    if (stats.reviewed) return '0 ćwiczeń do utrwalenia';
    return 'Na razie bez zaległych powtórek';
}
