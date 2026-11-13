import {rewardStars} from '../learning/rewards.ts';
import {homeFor,settleHouseUnlocks} from '../house/progress.ts';
import { journeyKey, lessons, makeLessonSession, rewardCompletion, unlocked, type Journey } from '../adventure.ts';
import { makeTrainingSession, mapTrainingPool, trainingPreparation } from '../learning/training.ts';
import { currentJourney, currentCourse, courseModules } from '../app/selectors.ts';
import { AppState } from '../app/state.ts';
import { makeSession, next, questionFor, recordAnswer, replaceActive, type Mode, type Progress, type Session } from '../core.ts';
import { getNextStep } from '../next-step.ts';
import { makeStageReviewSession, recordStageError } from '../stage-review.ts';
import {finishRetention,rememberError} from '../learning/retention.ts';
import {makeRecallSession,makeRitualSession} from '../learning/recall.ts';
import {needsSectionPlans,prepareSectionPlans} from '../learning/section-plan.ts';
import { makeCoursePracticeSession, type CoursePracticeMode } from '../learning/course-practice.ts';
import type { createCourseController } from './courses.ts';
import { courseKey } from '../learning/scope.ts';
import {followingLesson,lessonContext,legendarySession} from '../learning/lesson-flow.ts';
import {varyLesson} from '../learning/lesson-variety.ts';
import {answerOnBoard,gapTokens,placeGap,closeBoard,boardReady} from '../learning/boards.ts';
import {retryAnswer} from '../learning/retry.ts';
import {continueScene} from '../learning/scenes.ts';
interface LearningPorts {
    courses: ReturnType<typeof createCourseController>;
    mutate: (change: (p: Progress) => void) => Promise<void>;
    scheduleReviewMigration: () => void;
}
export function createLearningController(state: AppState, { mutate, scheduleReviewMigration, courses }: LearningPorts) {
    function showResume(){
        const active=state.progress.active,context=active?.lesson&&lessonContext(state.journeys,state.progress,active);
        if(context){state.selected=state.modules.find(m=>m.id===context.journey.moduleId)!;state.selectedJourneyKey=journeyKey(context.journey);state.introLessonId=context.lesson.id;state.screen='lesson-intro';}
        else state.screen='study';
    }
    async function preparePlans(){
        // Resuming an old session must not change its accompanying saved progress.
        if(state.progress.active)return;
        const maps=state.journeys.filter(j=>courseModules(state).some(m=>m.id===j.moduleId)&&!state.journeyIssues.some(issue=>issue.moduleId===j.moduleId));
        if(needsSectionPlans(maps,state.progress))await mutate(p=>prepareSectionPlans(maps,p));
    }
    function confirmReplacement(message: string): boolean {
        return !state.progress.active || window.confirm(message);
    }
    async function openSession(session: Session, resetRewards = true) {
        await mutate(p => { replaceActive(p, session); });
        if (resetRewards) {
            state.lastReward = 0;
            state.lastStageReward = 0;
        }
        state.screen = 'study';
    }
    async function startStageReview(j: Journey, stage: Journey['stages'][number]) {
        if (state.progress.active?.stageReview?.id === `${journeyKey(j)}/${stage.id}`) {
            state.screen = 'study';
            return;
        }
        const session = makeStageReviewSession(state.modules, j, stage, state.answerMode, state.progress);
        if (!session) {
            state.notice = 'Brak zaległych powtórek w tym etapie.';
            return;
        }
        if (!confirmReplacement('Rozpocząć powtórkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))
            return;
        await openSession(session);
    }
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        state.boardError=undefined;
        if(action==='pair-answer'){
            const active=state.progress.active;if(!active?.items[active.index].pairGroup)return true;
            const key=active.pairSelection??active.items[active.index].key,answer=el.dataset.answer??'';
            let ok:boolean|undefined;await mutate(p=>{ok=answerOnBoard(p,state.modules,state.journeys,key,answer);});
            if(ok===false)state.boardError={key,answer};return true;
        }
        if(action==='gap-place'){
            const key=el.dataset.key??'',answer=el.dataset.answer??state.progress.active?.gapSelection??state.progress.active?.draftAnswer;
            let ok:boolean|undefined;await mutate(p=>{ok=placeGap(p,state.modules,state.journeys,key,answer);});
            if(ok===false)state.boardError={key,answer:answer??''};return true;
        }
        if(action==='continue-lesson'){
            const active=state.progress.active,j=currentJourney(state);
            if(active?.lesson&&j&&active.lesson.id===`${journeyKey(j)}/${state.introLessonId}`)state.screen='study';
            return true;
        }
        if(action==='following-lesson'||action==='legendary'){
            const finished=state.lastSession??state.progress.sessions.at(-1);
            if(!finished?.lesson||!courseModules(state).some(m=>m.id===finished.moduleId))return true;
            const target=action==='legendary'?lessonContext(state.journeys,state.progress,finished):followingLesson(state.modules,state.journeys,state.progress,finished);
            if(!target){state.notice='Wszystkie dostępne lekcje ukończone. Gratulacje!';return true;}
            state.selected=state.modules.find(m=>m.id===target.journey.moduleId)!;state.selectedJourneyKey=journeyKey(target.journey);state.introLessonId=target.lesson.id;state.answerMode='mixed';
            if(action==='following-lesson'){state.screen='lesson-intro';return true;}
            const session=legendarySession(state.modules,finished,{...target,progress:state.progress});
            if(!session){state.notice='Ta starsza lekcja wymaga dostępnej wersji materiału. Wyniki pozostają zachowane.';return true;}
            if(!confirmReplacement('Rozpocząć poziom legendarny zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))return true;
            varyLesson(session,state.modules,state.journeys,target.journey,target.lesson,state.progress,false);
            await openSession(session);return true;
        }
        if(action==='pair-select'||action==='bank-select'){
            await mutate(p=>{const s=p.active;if(!s||!['question','retry'].includes(s.phase))return;
                const current=s.items[s.index];
                if(action==='pair-select'&&s.phase==='question'&&current.pairGroup&&s.items.slice(s.index).some(i=>i.key===el.dataset.key&&i.pairGroup===current.pairGroup))s.pairSelection=el.dataset.key;
                if(action==='bank-select'&&current.presentation==='bank'&&gapTokens(state.modules,s).includes(el.dataset.answer??''))s.gapSelection=el.dataset.answer;
            });return true;
        }
        if(action==='retry-maps'){window.location.reload();return true;}
        if(action==='prepare-training'){
            const j=currentJourney(state),l=j&&lessons(j).find(e=>e.lesson.id===state.introLessonId)?.lesson;
            if(!j||l?.role!=='training'||!unlocked(j,l,state.progress))return true;
            const source=trainingPreparation(state.modules,state.journeys,j,state.progress);
            if(!source){state.notice='Wczytaj mapy, aby przygotować się do rozgrzewki.';return true;}
            state.notice=`Po tej lekcji wróć do rozgrzewki na mapie „${j.title}”. Twoje postępy pozostają zapisane.`;
            state.selected=state.modules.find(m=>m.id===source.journey.moduleId)!;
            state.selectedJourneyKey=journeyKey(source.journey);
            state.introLessonId=source.lesson.id;state.answerMode='mixed';state.screen='lesson-intro';return true;
        }
        if(action==='warmup'){state.screen='warmup';return true;}
        if(action==='module-ritual'){
            const m=courseModules(state).find(m=>m.id===el.dataset.module),kind=el.dataset.kind;
            if(!m||(kind!=='opening'&&kind!=='finale'))return true;
            await preparePlans();
            if(kind==='finale'&&state.journeyIssues.some(issue=>issue.moduleId===m.id)){state.notice='Wczytaj wszystkie mapy modułu przed misją finałową.';return true;}
            const map=state.journeys.find(j=>j.moduleId===m.id&&journeyKey(j)===el.dataset.journey);
            const session=makeRitualSession(state.modules,state.journeys,m,state.progress,kind,state.answerMode,map);
            if(!session){state.notice=kind==='opening'?'To początek przygody! Zacznij od pierwszej lekcji — nie ma jeszcze materiału z wcześniejszych modułów.':'Najpierw poznaj materiał i ukończ mapy tego modułu. Misja będzie wtedy gotowa.';return true;}
            if(!confirmReplacement('Rozpocząć kocie ćwiczenia zamiast niedokończonej sesji? Wyniki pozostaną zachowane.'))return true;
            state.selected=m;await openSession(session);return true;
        }
        if (action === 'courses') { state.screen = 'courses'; return true; }
        if (action === 'progress-course') { if (await courses.select(el.dataset.id ?? '')) state.screen = 'progress'; return true; }
        if (action === 'select-course') { if (await courses.select(el.dataset.id ?? '')) state.screen = 'home'; return true; }
        if (action === 'resume') { await courses.followSession(); showResume(); return true; }
        if (action === 'module' || action === 'quick-start') {
            const m = state.modules.find(m => m.id === el.dataset.id);
            if (m) { if (courseKey(m) !== state.selectedCourseId) await courses.select(courseKey(m)); state.selected = m; state.screen = 'setup'; }
            return true;
        }
        if (action === 'course-practice') { state.screen = 'course-practice'; return true; }
        if (action === 'course-mode') {
            if (!['flashcards','quiz','grammar'].includes(el.dataset.mode ?? '')) return true;
            const anchor = courseModules(state)[0]; if (!anchor) return true;
            const session = makeCoursePracticeSession(state.modules, anchor, state.progress, el.dataset.mode as CoursePracticeMode, state.answerMode);
            if (!session) { state.notice = 'Nie ma jeszcze poznanego materiału dla tego ćwiczenia. Zacznij od mapy lub modułu.'; return true; }
            if (!confirmReplacement('Nowa sesja zastąpi niedokończoną sesję. Zakończone wyniki pozostaną zachowane. Kontynuować?')) return true;
            await openSession(session);
            return true;
        }
        if (action === 'next-step') {
            await preparePlans();
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
                        await startStageReview(j, stage);
                    break;
                }
                case 'review': {
                    const session = makeSession(state.modules, state.selected, 'review', 'text', false, state.progress);
                    if (session.items.length) {
                        await openSession(session);
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
        if (action === 'journeys') {
            await preparePlans();
            state.screen = 'journeys';
            scheduleReviewMigration();
            return true;
        }
        if (action === 'module-list') {
            state.screen = 'module-list';
            return true;
        }
        if (action === 'map') {
            const module = state.modules.find(m => m.id === el.dataset.id);
            if (module) { if (courseKey(module) !== state.selectedCourseId) await courses.select(courseKey(module)); state.selected = module; }
            state.selected ??= courseModules(state)[0];
            await preparePlans();
            if (el.dataset.journey !== undefined) state.selectedJourneyKey = el.dataset.journey;
            state.screen = 'map';
            scheduleReviewMigration();
            return true;
        }
        if (action === 'stage-review') {
            const j = el.dataset.journey?state.journeys.find(j=>journeyKey(j)===el.dataset.journey):currentJourney(state), stage = j?.stages.find(s => s.id === el.dataset.id);
            if(j&&!courseModules(state).some(m=>m.id===j.moduleId))return true;
            if(j){state.selected=state.modules.find(m=>m.id===j.moduleId)!;state.selectedJourneyKey=journeyKey(j);}
            if (!j || !stage)
                return true;
            await startStageReview(j, stage);
            return true;
        }
        if (action === 'open-lesson' || action === 'begin-lesson') {
            await preparePlans();
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
            if(l.role==='training'&&!mapTrainingPool(state.modules,state.journeys,j,state.progress,l).length){state.introLessonId=l.id;state.screen='lesson-intro';return true;}
            if (!(el.dataset.restart==='true'&&state.progress.active?.lesson?.id===`${journeyKey(j)}/${l.id}`)&&!confirmReplacement('Rozpocząć lekcję zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))
                return true;
            const session = l.role === 'training'
                ? makeTrainingSession(state.modules, state.selected, state.progress, 'mixed', { journey: j, lesson: l, journeys: state.journeys })
                : l.role==='recall'?makeRecallSession(state.modules,state.journeys,j,l,state.progress)
                : makeLessonSession(state.modules, j, l, 'mixed', state.progress);
            if (!session) { state.notice = l.role==='recall'?'Najpierw spróbuj kilku wcześniejszych lekcji. Ta powtórka korzysta wyłącznie z poznanego materiału.':'Nie ma jeszcze poznanego materiału z wcześniejszych map do tego treningu.'; return true; }
            varyLesson(session,state.modules,state.journeys,j,l,state.progress);
            await openSession(session);
            return true;
        }
        if (action === 'extra-training') {
            const anchor=el.dataset.module?courseModules(state).find(m=>m.id===el.dataset.module):courseModules(state).find(m=>m.id===state.selected?.id)??courseModules(state)[0];
            if(!anchor)return true;state.selected=anchor;
            const session = makeTrainingSession(state.modules, anchor, state.progress, state.answerMode,undefined,!!el.dataset.module);
            if (!session) { state.notice = 'Najpierw spróbuj odpowiedzieć na kilka pytań. Rozgrzewka obejmuje tylko wcześniej poznany materiał.'; return true; }
            if (!confirmReplacement('Rozpocząć rozgrzewkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.')) return true;
            await openSession(session);
            return true;
        }
        if (action === 'mode') {
            if(el.dataset.module){const m=courseModules(state).find(m=>m.id===el.dataset.module);if(!m)return true;state.selected=m;}
            state.mode = el.dataset.mode as Mode;
            const session = makeSession(state.modules, state.selected, state.mode, state.answerMode, state.previous, state.progress);
            if (!session.items.length) {
                state.notice = 'Nie ma zadań do tej sesji. Znane fiszki pomijamy. Możesz wybrać quiz lub gramatykę.';
                return true;
            }
            if (!confirmReplacement('Rozpoczęcie nowej sesji zastąpi niedokończoną sesję. Zakończona historia i zapisane trudności pozostaną. Kontynuować?'))
                return true;
            await openSession(session, false);
        }
        else if (action === 'answer') {
            const s = state.progress.active;
            if (!s)
                return true;
            if(!el.dataset.answer?.trim())return true;
            await mutate(p => { const session = p.active!;
                const q=questionFor(state.modules,session.items[session.index]);
                if (recordAnswer(p, q, el.dataset.answer ?? '') === false){
                rememberError(p,session.items[session.index]);
                recordStageError(p, session, session.items[session.index], state.journeys);
            }
                else continueScene(p);
            });
        }
        else if (action === 'retry')
            await mutate(p => {retryAnswer(p,el.dataset.key);});
        else if (action === 'next') {
            const active=state.progress.active,current=active?.items[active.index];
            if(active&&(current?.pairGroup||current?.presentation==='bank')&&!boardReady(active))return true;
            const rewardCourse=currentCourse(state)!.id;
            const earned = homeFor(state.progress,rewardCourse)?.earned ?? 0, bonuses = Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length;
            state.lastReward = 0;
            state.lastStageReward = 0;
            const unlockedRooms:string[]=[];
            await mutate(p => { closeBoard(p,state.modules,state.journeys);if (p.active?.phase === 'feedback') {
                const finished = p.active;
                delete finished.pairSelection;delete finished.draftAnswer;
                delete finished.boardSummary;delete finished.gapSelection;delete finished.gapPlacements;
                next(p);
                if (!p.active) {
                    finishRetention(p, finished);
                    rewardCompletion(p, finished,state.modules);
                    unlockedRooms.push(...settleHouseUnlocks(p,state.modules,state.journeys,state.journeyIssues));
                }
            } });
            if (!state.progress.active) {
                if(unlockedRooms.length)state.notice=`Nowy pokój: ${unlockedRooms.join(', ')}! Otwórz Domek, aby go urządzić.`;
                state.lastReward = (homeFor(state.progress,rewardCourse)?.earned ?? 0) - earned;
                state.lastStageReward = (Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length - bonuses) * rewardStars.stageMastery;
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
