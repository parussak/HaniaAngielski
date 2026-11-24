import {journeyKey, lessons, type Journey, type Stage} from './journey.ts';
import {makeLessonSession} from './lesson-session.ts';
import {unlocked} from './journey-progress.ts';
import { makeStageReviewSession } from '../stage-review.ts';
import { followingLesson, lessonContext, legendarySession } from './lesson-flow.ts';
import { varyLesson } from './lesson-variety.ts';
import { makeRecallSession } from './recall.ts';
import { makeTrainingSession, mapTrainingPool } from './training.ts';
import type { Selection, StartInput, StartPlan } from './start-plan.ts';
import type { Session } from './model.ts';

/** Planery startu z mapy: lekcja, kolejna lekcja, poziom legendarny, powtórka etapu. Czyste funkcje (patrz `start-plan.ts`). */

type Target = NonNullable<ReturnType<typeof followingLesson>>;
export type After =
    | { kind: 'none' }
    | { kind: 'notice'; text: string }
    | { kind: 'found'; finished: Session; target: Target; selection: Selection };

/** The lesson after the finished one, or the finished one itself for the legendary level. */
export function planLessonAfterFinished(input: StartInput, action: 'following-lesson' | 'legendary'): After {
    const finished = input.lastSession ?? input.progress.sessions.at(-1);
    if (!finished?.lesson || !input.courseModules.some(m => m.id === finished.moduleId)) return { kind: 'none' };
    const target = action === 'legendary' ? lessonContext(input.journeys, input.progress, finished) : followingLesson(input.modules, input.journeys, input.progress, finished);
    if (!target) return { kind: 'notice', text: 'Wszystkie dostępne lekcje ukończone. Gratulacje!' };
    return { kind: 'found', finished, target, selection: { module: input.modules.find(m => m.id === target.journey.moduleId)!, journeyKey: journeyKey(target.journey), introLessonId: target.lesson.id, answerMode: 'mixed' } };
}

export function planLegendary(input: StartInput): StartPlan {
    const found = planLessonAfterFinished(input, 'legendary');
    if (found.kind === 'none') return { kind: 'ignore' };
    if (found.kind === 'notice') return found;
    const { finished, target, selection } = found;
    const session = legendarySession(input.modules, finished, { ...target, progress: input.progress });
    if (!session) return { kind: 'notice', text: 'Ta starsza lekcja wymaga dostępnej wersji materiału. Wyniki pozostają zachowane.', selection };
    varyLesson(session, input.modules, input.journeys, target.journey, target.lesson, input.progress, false);
    return { kind: 'open', session, confirm: 'Rozpocząć poziom legendarny zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', selection, resetRewards: true };
}

/** `restart`: wznowienie tej samej, trwającej lekcji nie pyta o zastąpienie sesji. */
export function planBeginLesson(input: StartInput, dataset: { id?: string; restart?: string }): StartPlan {
    const j = input.currentJourney, l = j && lessons(j).find(l => l.lesson.id === dataset.id)?.lesson;
    if (!j || !l || !unlocked(j, l, input.progress)) return { kind: 'notice', text: 'Najpierw ukończ wcześniejszą lekcję.' };
    if (l.role === 'training' && !mapTrainingPool(input.modules, input.journeys, j, input.progress, l).length) return { kind: 'intro', selection: { introLessonId: l.id } };
    const session = l.role === 'training'
        ? makeTrainingSession(input.modules, input.selected!, input.progress, 'mixed', { journey: j, lesson: l, journeys: input.journeys })
        : l.role === 'recall' ? makeRecallSession(input.modules, input.journeys, j, l, input.progress)
        : makeLessonSession(input.modules, j, l, 'mixed', input.progress);
    if (!session) return { kind: 'notice', text: l.role === 'recall' ? 'Najpierw spróbuj kilku wcześniejszych lekcji. Ta powtórka korzysta wyłącznie z poznanego materiału.' : 'Nie ma jeszcze poznanego materiału z wcześniejszych map do tego treningu.' };
    varyLesson(session, input.modules, input.journeys, j, l, input.progress);
    const sameRunning = dataset.restart === 'true' && input.progress.active?.lesson?.id === `${journeyKey(j)}/${l.id}`;
    return { kind: 'open', session, confirm: sameRunning ? null : 'Rozpocząć lekcję zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', resetRewards: true };
}

/** Powtórka jednego etapu mapy; trwająca powtórka tego etapu jest tylko wznawiana. */
export function planStageReview(input: StartInput, j: Journey, stage: Stage): StartPlan {
    if (input.progress.active?.stageReview?.id === `${journeyKey(j)}/${stage.id}`) return { kind: 'resume' };
    const session = makeStageReviewSession(input.modules, j, stage, input.answerMode, input.progress);
    if (!session) return { kind: 'notice', text: 'Brak zaległych powtórek w tym etapie.' };
    return { kind: 'open', session, confirm: 'Rozpocząć powtórkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.', resetRewards: true };
}

/** Akcja „stage-review” z ekranu: wybiera mapę, a potem planuje powtórkę etapu. */
export function planStageReviewAction(input: StartInput, dataset: { journey?: string; id?: string }): StartPlan {
    const j = dataset.journey ? input.journeys.find(j => journeyKey(j) === dataset.journey) : input.currentJourney;
    const stage = j?.stages.find(s => s.id === dataset.id);
    if (j && !input.courseModules.some(m => m.id === j.moduleId)) return { kind: 'ignore' };
    const selection = j ? { module: input.modules.find(m => m.id === j.moduleId)!, journeyKey: journeyKey(j) } : undefined;
    if (!j || !stage) return { kind: 'ignore', selection };
    return { ...planStageReview(input, j, stage), selection };
}
