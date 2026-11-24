import {journeyKey, lessons} from '../learning/journey.ts';
import {unlocked} from '../learning/journey-progress.ts';
import { trainingPreparation } from '../learning/training.ts';
import { currentJourney, currentCourse, courseModules } from '../app/selectors.ts';
import { makeSession } from '../learning/session.ts';
import { type Progress } from '../learning/model.ts';
import { getNextStep } from '../next-step.ts';
import type { createCourseController } from './courses.ts';
import { courseKey } from '../learning/scope.ts';
import {lessonContext} from '../learning/lesson-flow.ts';
import {createSessionAnswerController,type AnswerState} from './session-answers.ts';
import {createSessionStartController,type SessionStartState} from './session-start.ts';
import {createReadingController,type ReadingState} from './reading.ts';
import {unhandled} from '../app/actions.ts';
import type {SettingChange} from '../app/form-payloads.ts';
import {isCallOwnedBy,type OwnerCall} from '../app/action-payloads.ts';
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
    /** Ponowne wczytanie strony (w przeglądarce `location.reload`) — ponowienie ładowania map. */
    reload: () => void;
    /** Pytanie o zgodę przed zastąpieniem trwającej sesji (w przeglądarce `window.confirm`). */
    confirm: (message: string) => boolean;
    courses: ReturnType<typeof createCourseController>;
    mutate: (change: (p: Progress) => void) => Promise<void>;
    scheduleReviewMigration: () => void;
}
// Nawigacja między ekranami nauki. Rozpoczynanie sesji jest w `session-start.ts`,
// odpowiedzi w trwającej sesji w `session-answers.ts`, „Dalej” w czytance w `reading.ts`.
export function createLearningController(state: LearningState, { mutate, scheduleReviewMigration, courses, reload, confirm }: LearningPorts) {
    const answers=createSessionAnswerController(state,{mutate,courseId:()=>currentCourse(state)!.id});
    const reading=createReadingController(state,{mutate});
    const starts=createSessionStartController(state,{mutate,confirm});
    function showResume(){
        const active=state.progress.active,context=active?.lesson&&lessonContext(state.journeys,state.progress,active);
        if(context){state.selected=state.modules.find(m=>m.id===context.journey.moduleId)!;state.selectedJourneyKey=journeyKey(context.journey);state.introLessonId=context.lesson.id;state.screen='lesson-intro';}
        else state.screen='study';
    }
    // Akcje nauki: nawigację obsługuje ten plik, resztę jej właściciele (spis: app/actions.ts).
    async function handleAction(...call: OwnerCall<'navigation' | 'starts' | 'answers' | 'reading'>): Promise<boolean> {
        if(isCallOwnedBy('answers',call))return answers.handleAction(...call);
        if(isCallOwnedBy('reading',call))return reading.handleAction(...call);
        if(isCallOwnedBy('starts',call))return starts.handleAction(...call);
        return navigate(...call as OwnerCall<'navigation'>);
    }
    async function navigate(...[action, payload]: OwnerCall<'navigation'>): Promise<boolean> {
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
        case 'retry-maps':{reload();return true;}
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
        case 'progress-course':{ if (await courses.select(payload.id)) state.screen = 'progress'; return true; }
        case 'select-course':{ if (await courses.select(payload.id)) state.screen = 'home'; return true; }
        case 'resume':{ await courses.followSession(); showResume(); return true; }
        case 'module':{
            const m = state.modules.find(m => m.id === payload.id);
            if (m) { if (courseKey(m) !== state.selectedCourseId) await courses.select(courseKey(m)); state.selected = m; state.screen = 'setup'; }
            return true;
        }
        case 'course-practice':{ state.screen = 'course-practice'; return true; }
        case 'grammar':{ state.screen = 'grammar'; return true; }
        case 'grammar-lesson':{
            const j = state.journeys.find(j => j.moduleId === payload.module && journeyKey(j) === payload.journey), m = state.modules.find(m => m.id === payload.module);
            if (j && m && courseModules(state).includes(m) && lessons(j).some(l => l.lesson.id === payload.id)) {
                state.selected = m; state.selectedJourneyKey = journeyKey(j); state.introLessonId = payload.id; state.answerMode = 'mixed'; state.screen = 'lesson-intro';
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
            const module = state.modules.find(m => m.id === payload.id);
            if (module) { if (courseKey(module) !== state.selectedCourseId) await courses.select(courseKey(module)); state.selected = module; }
            state.selected ??= courseModules(state)[0];
            await starts.preparePlans();
            if (payload.journey !== undefined) state.selectedJourneyKey = payload.journey;
            state.screen = 'map';
            scheduleReviewMigration();
            return true;
        }
        case 'open-lesson':{
            await starts.preparePlans();
            const j = currentJourney(state), l = j && lessons(j).find(l => l.lesson.id === payload.id)?.lesson;
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
    /** Ustawienie nauki odczytane przez granicę zdarzeń (`app/form-payloads.ts`). */
    function handleSettingsChange(change:SettingChange){
        if(change.kind==='answerMode')state.answerMode=change.value;
        else state.previous=change.checked;
    }
    return { handleAction,handleSettingsChange };
}
