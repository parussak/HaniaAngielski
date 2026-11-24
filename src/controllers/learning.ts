import {journeyKey, lessons} from '../learning/journey.ts';
import {unlocked} from '../learning/journey-progress.ts';
import { trainingPreparation } from '../learning/training.ts';
import { currentJourney, currentCourse, courseModules } from '../app/selectors.ts';
import { makeSession } from '../learning/session.ts';
import { type AnswerMode, type Progress } from '../learning/model.ts';
import { getNextStep } from '../next-step.ts';
import type { createCourseController } from './courses.ts';
import { courseKey } from '../learning/scope.ts';
import {lessonContext} from '../learning/lesson-flow.ts';
import {createSessionAnswerController,type AnswerState} from './session-answers.ts';
import {createSessionStartController,type SessionStartState} from './session-start.ts';
import {createReadingController,type ReadingState} from './reading.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';
/**
 * Jedyne, co kontroler nauki widzi ze stanu (najwęższy dostęp): to, czego sam potrzebuje do
 * nawigacji, oraz wąskie stany kontrolerów, które składa (odpowiedzi, czytanka, start sesji).
 * Nie zawiera pól domku, konta ani kopii zapasowej.
 */
export interface LearningState extends AnswerState, ReadingState, SessionStartState {
    readonly progress: Progress;
    // Oba kontrolery liczą zdania czytanki na ekranie; pole jedno, zmienia je kontroler czytanki.
    readingShown?: ReadingState['readingShown'];
}
interface LearningPorts {
    courses: ReturnType<typeof createCourseController>;
    mutate: (change: (p: Progress) => void) => Promise<void>;
    scheduleReviewMigration: () => void;
}
// Nawigacja między ekranami nauki. Rozpoczynanie sesji jest w `session-start.ts`,
// odpowiedzi w trwającej sesji w `session-answers.ts`, „Dalej” w czytance w `reading.ts`.
export function createLearningController(state: LearningState, { mutate, scheduleReviewMigration, courses }: LearningPorts) {
    const answers=createSessionAnswerController(state,{mutate,courseId:()=>currentCourse(state)!.id});
    const reading=createReadingController(state,{mutate});
    const starts=createSessionStartController(state,{mutate});
    function showResume(){
        const active=state.progress.active,context=active?.lesson&&lessonContext(state.journeys,state.progress,active);
        if(context){state.selected=state.modules.find(m=>m.id===context.journey.moduleId)!;state.selectedJourneyKey=journeyKey(context.journey);state.introLessonId=context.lesson.id;state.screen='lesson-intro';}
        else state.screen='study';
    }
    // Akcje nauki: nawigację obsługuje ten plik, resztę jej właściciele (spis: app/actions.ts).
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if(isOwnedBy('answers',action))return answers.handleAction(action,el);
        if(isOwnedBy('reading',action))return reading.handleAction(action,el);
        if(isOwnedBy('starts',action))return starts.handleAction(action,el);
        return navigate(action,el);
    }
    async function navigate(action: string, el: HTMLElement): Promise<boolean> {
        if(!isOwnedBy('navigation',action))return false;
        switch(action){
        case 'continue-lesson':{
            const active=state.progress.active,j=currentJourney(state);
            if(active?.lesson&&j&&active.lesson.id===`${journeyKey(j)}/${state.introLessonId}`)state.screen='study';
            return true;
        }
        case 'following-lesson':{
            if(starts.lessonAfterFinished(action))state.screen='lesson-intro';
            return true;
        }
        case 'retry-maps':{window.location.reload();return true;}
        case 'prepare-training':{
            const j=currentJourney(state),l=j&&lessons(j).find(e=>e.lesson.id===state.introLessonId)?.lesson;
            if(!j||l?.role!=='training'||!unlocked(j,l,state.progress))return true;
            const source=trainingPreparation(state.modules,state.journeys,j,state.progress);
            if(!source){state.notice='Wczytaj mapy, aby przygotować się do rozgrzewki.';return true;}
            state.notice=`Po tej lekcji wróć do rozgrzewki na mapie „${j.title}”. Twoje postępy pozostają zapisane.`;
            state.selected=state.modules.find(m=>m.id===source.journey.moduleId)!;
            state.selectedJourneyKey=journeyKey(source.journey);
            state.introLessonId=source.lesson.id;state.answerMode='mixed';state.screen='lesson-intro';return true;
        }
        case 'warmup':{state.screen='warmup';return true;}
        case 'courses':{ state.screen = 'courses'; return true; }
        case 'progress-course':{ if (await courses.select(el.dataset.id ?? '')) state.screen = 'progress'; return true; }
        case 'select-course':{ if (await courses.select(el.dataset.id ?? '')) state.screen = 'home'; return true; }
        case 'resume':{ await courses.followSession(); showResume(); return true; }
        case 'module':case 'quick-start':{
            const m = state.modules.find(m => m.id === el.dataset.id);
            if (m) { if (courseKey(m) !== state.selectedCourseId) await courses.select(courseKey(m)); state.selected = m; state.screen = 'setup'; }
            return true;
        }
        case 'course-practice':{ state.screen = 'course-practice'; return true; }
        case 'grammar':{ state.screen = 'grammar'; return true; }
        case 'grammar-lesson':{
            const j = state.journeys.find(j => j.moduleId === el.dataset.module && journeyKey(j) === el.dataset.journey), m = state.modules.find(m => m.id === el.dataset.module);
            if (j && m && courseModules(state).includes(m) && lessons(j).some(l => l.lesson.id === el.dataset.id)) {
                state.selected = m; state.selectedJourneyKey = journeyKey(j); state.introLessonId = el.dataset.id!; state.answerMode = 'mixed'; state.screen = 'lesson-intro';
            }
            return true;
        }
        case 'next-step':{
            await starts.preparePlans();
            const step = getNextStep(state.modules, state.journeys, state.progress, currentCourse(state)?.id);
            state.selected = state.modules.find(m => m.id === step.moduleId) ?? state.selected ?? state.modules[0];
            state.selectedJourneyKey = step.journeyId ?? '';
            switch (step.kind) {
                case 'resume':
                    showResume();
                    break;
                case 'lesson':
                    state.introLessonId = step.lessonId;
                    state.answerMode = 'mixed';
                    state.screen = 'lesson-intro';
                    break;
                case 'stage-review': {
                    const j = currentJourney(state), stage = j?.stages.find(s => s.id === step.stageId);
                    if (j && stage)
                        await starts.startStageReview(j, stage);
                    break;
                }
                case 'review': {
                    const session = makeSession(state.modules, state.selected, 'review', 'text', false, state.progress);
                    if (session.items.length) {
                        await starts.openSession(session);
                    }
                    break;
                }
                case 'practice':
                    state.screen = step.moduleId ? 'warmup' : 'module-list';
                    break;
                case 'unavailable':
                    state.screen = 'module-list';
                    break;
            }
            return true;
        }
        case 'journeys':{
            await starts.preparePlans();
            state.screen = 'journeys';
            scheduleReviewMigration();
            return true;
        }
        case 'module-list':{
            state.screen = 'module-list';
            return true;
        }
        case 'map':{
            const module = state.modules.find(m => m.id === el.dataset.id);
            if (module) { if (courseKey(module) !== state.selectedCourseId) await courses.select(courseKey(module)); state.selected = module; }
            state.selected ??= courseModules(state)[0];
            await starts.preparePlans();
            if (el.dataset.journey !== undefined) state.selectedJourneyKey = el.dataset.journey;
            state.screen = 'map';
            scheduleReviewMigration();
            return true;
        }
        case 'open-lesson':{
            await starts.preparePlans();
            const j = currentJourney(state), l = j && lessons(j).find(l => l.lesson.id === el.dataset.id)?.lesson;
            if (!j || !l || !unlocked(j, l, state.progress)) {
                state.notice = 'Najpierw ukończ wcześniejszą lekcję.';
                return true;
            }
            state.introLessonId = l.id;
            state.answerMode = 'mixed';
            state.screen = 'lesson-intro';
            return true;
        }
        default:return unhandled(action);
        }
    }
    function handleSettingsChange(input:HTMLInputElement){
        if(input.name==='answerMode')state.answerMode=input.value as AnswerMode;
        if(input.id==='previous')state.previous=input.checked;
    }
    return { handleAction,handleSettingsChange };
}
