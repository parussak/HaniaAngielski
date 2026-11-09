import { lessons, makeLessonSession, place, purchase, rewardCompletion, unlocked, type Journey } from '../adventure.ts';
import { currentJourney } from '../app/selectors.ts';
import { AppState } from '../app/state.ts';
import { makeSession, next, questionFor, recordAnswer, type Mode, type Progress } from '../core.ts';
import { getNextStep } from '../next-step.ts';
import { finishStageReview, makeStageReviewSession, recordStageError } from '../stage-review.ts';
interface LearningPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
    scheduleReviewMigration: () => void;
}
export function createLearningController(state: AppState, { mutate, scheduleReviewMigration }: LearningPorts) {
    async function startStageReview(j: Journey, stage: Journey['stages'][number]) {
        if (state.progress.active?.stageReview?.id === `${j.moduleId}/${stage.id}`) {
            state.screen = 'study';
            return;
        }
        const session = makeStageReviewSession(state.modules, j, stage, state.answerMode, state.progress);
        if (!session) {
            state.notice = 'Brak zaległych powtórek w tym etapie.';
            return;
        }
        if (state.progress.active && !window.confirm('Rozpocząć powtórkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))
            return;
        await mutate(p => { p.active = session; });
        state.lastReward = 0;
        state.lastStageReward = 0;
        state.screen = 'study';
    }
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if (action === 'next-step') {
            const step = getNextStep(state.modules, state.journeys, state.progress);
            state.selected = state.modules.find(m => m.id === step.moduleId) ?? state.selected ?? state.modules[0];
            switch (step.kind) {
                case 'resume':
                    state.screen = 'study';
                    break;
                case 'lesson':
                    state.introLessonId = step.lessonId;
                    state.answerMode = 'mixed';
                    state.screen = 'lesson-intro';
                    break;
                case 'stage-review': {
                    const j = currentJourney(state), stage = j?.stages.find(s => s.id === step.stageId);
                    if (j && stage)
                        await startStageReview(j, stage);
                    break;
                }
                case 'review': {
                    const session = makeSession(state.modules, state.selected, 'review', 'text', false, state.progress);
                    if (session.items.length) {
                        await mutate(p => { p.active = session; });
                        state.lastReward = 0;
                        state.lastStageReward = 0;
                        state.screen = 'study';
                    }
                    break;
                }
                case 'practice':
                    state.screen = step.moduleId ? 'setup' : 'module-list';
                    break;
                case 'unavailable':
                    state.screen = 'module-list';
                    break;
            }
            return true;
        }
        if (action === 'journeys') {
            state.screen = 'journeys';
            scheduleReviewMigration();
            return true;
        }
        if (action === 'module-list') {
            state.screen = 'module-list';
            return true;
        }
        if (action === 'map') {
            state.selected = state.modules.find(m => m.id === el.dataset.id) ?? state.selected ?? state.modules[0];
            state.screen = 'map';
            scheduleReviewMigration();
            return true;
        }
        if (action === 'stage-review') {
            const j = currentJourney(state), stage = j?.stages.find(s => s.id === el.dataset.id);
            if (!j || !stage)
                return true;
            await startStageReview(j, stage);
            return true;
        }
        if (action === 'house') {
            state.screen = 'house';
            return true;
        }
        if (action === 'open-lesson' || action === 'begin-lesson') {
            const j = currentJourney(state), l = j && lessons(j).find(l => l.lesson.id === el.dataset.id)?.lesson;
            if (!j || !l || !unlocked(j, l, state.progress)) {
                state.notice = 'Najpierw ukończ wcześniejszą lekcję.';
                return true;
            }
            if (action === 'open-lesson') {
                state.introLessonId = l.id;
                state.answerMode = 'mixed';
                state.screen = 'lesson-intro';
                return true;
            }
            if (state.progress.active && !window.confirm('Rozpocząć lekcję zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))
                return true;
            await mutate(p => { p.active = makeLessonSession(state.modules, j, l, state.answerMode, p); });
            state.lastReward = 0;
            state.lastStageReward = 0;
            state.screen = 'study';
            return true;
        }
        if (action === 'select-decoration') {
            state.chosenDecoration = el.dataset.id ?? 'pillow';
            return true;
        }
        if (action === 'buy-decoration') {
            let bought = false;
            await mutate(p => { bought = purchase(p, el.dataset.id ?? ''); });
            state.notice = bought ? 'Nowa dekoracja jest Twoja! Możesz wybrać dla niej miejsce.' : 'Przedmiot jest już Twój albo potrzeba jeszcze kilku gwiazdek.';
            return true;
        }
        if (action === 'place-decoration') {
            await mutate(p => { place(p, el.dataset.id ?? '', el.dataset.slot || null); });
            state.notice = 'Ustawienie domku zapisane.';
            return true;
        }
        if (action === 'mode') {
            state.mode = el.dataset.mode as Mode;
            const session = makeSession(state.modules, state.selected, state.mode, state.answerMode, state.previous, state.progress);
            if (!session.items.length) {
                state.notice = 'Nie ma zadań do tej sesji. Znane fiszki pomijamy. Możesz wybrać quiz lub gramatykę.';
                return true;
            }
            if (state.progress.active && !window.confirm('Rozpoczęcie nowej sesji zastąpi niedokończoną sesję. Zakończona historia i zapisane trudności pozostaną. Kontynuować?'))
                return true;
            await mutate(p => { p.active = session; });
            state.screen = 'study';
        }
        else if (action === 'answer') {
            const s = state.progress.active;
            if (!s)
                return true;
            const q = questionFor(state.modules, s.items[s.index]);
            await mutate(p => { const session = p.active!; if (recordAnswer(p, q, el.dataset.answer ?? '') === false)
                recordStageError(p, session, session.items[session.index], state.journeys); });
        }
        else if (action === 'retry')
            await mutate(p => { if (p.active?.phase === 'feedback' && p.active.lastCorrect === false) {
                p.active.phase = 'retry';
                p.active.lastCorrect = null;
            } });
        else if (action === 'next') {
            const earned = state.progress.adventure?.earned ?? 0, bonuses = Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length;
            state.lastReward = 0;
            state.lastStageReward = 0;
            await mutate(p => { if (p.active?.phase === 'feedback') {
                const finished = p.active;
                next(p);
                if (!p.active) {
                    finishStageReview(p, finished);
                    rewardCompletion(p, finished);
                }
            } });
            if (!state.progress.active) {
                state.lastReward = (state.progress.adventure?.earned ?? 0) - earned;
                state.lastStageReward = (Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length - bonuses) * 3;
                state.lastSession = state.progress.sessions.at(-1)!;
                state.screen = 'summary';
            }
        }
        else
            return false;
        return true;
    }
    function handleSettingsChange(input:HTMLInputElement){
        if(input.name==='answerMode')state.answerMode=input.value as AppState['answerMode'];
        if(input.id==='previous')state.previous=input.checked;
    }
    return { handleAction,handleSettingsChange };
}
