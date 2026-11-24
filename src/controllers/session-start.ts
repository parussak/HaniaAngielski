import type {Journey, JourneyIssue} from '../learning/journey.ts';
import {journeyKey} from '../learning/journey.ts';
import { currentJourney, courseModules, type JourneyScope } from '../app/selectors.ts';
import type { Screen } from '../app/state.ts';
import { replaceActive } from '../learning/session.ts';
import { type AnswerMode, type Mode, type Module, type Progress, type Session } from '../learning/model.ts';
import { needsSectionPlans, prepareSectionPlans } from '../learning/section-plan.ts';
import type { Selection, StartInput, StartPlan } from '../learning/start-plan.ts';
import { planBeginLesson, planLegendary, planLessonAfterFinished, planStageReview, planStageReviewAction } from '../learning/start-lesson-plans.ts';
import { isOwnedBy, unhandled } from '../app/actions.ts';
import { planCourseMode, planExtraTraining, planGrammarPractice, planMode, planReadingStart, planRitual } from '../learning/start-practice-plans.ts';
/**
 * Jedyne, co kontroler rozpoczynania sesji widzi ze stanu: dane do odczytu (przez planery) oraz
 * pola wyboru i ekranu, które zmieniają wyłącznie `applySelection`, `applyPlan` i `openSession`.
 */
export interface SessionStartState extends JourneyScope {
    readonly journeyIssues: JourneyIssue[];
    lastSession: Session | null;
    selected: Module;
    selectedJourneyKey: string;
    introLessonId: string;
    answerMode: AnswerMode;
    previous: boolean;
    mode: Mode;
    notice: string;
    lastReward: number;
    lastStageReward: number;
    screen: Screen;
}
interface SessionStartPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}
// Rozpoczynanie sesji. Decyzje (jaka sesja, jaki komunikat) podejmują czyste planery w
// `learning/start-*-plans.ts`; ta powłoka jako jedyna pyta o zastąpienie sesji i zmienia stan.
// Nawigacja między ekranami zostaje w `learning.ts`.
export function createSessionStartController(state: SessionStartState, { mutate }: SessionStartPorts) {
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
    /** Dane dla planerów: wycinek stanu do odczytu, bez samego `state`. */
    function startInput(): StartInput {
        return {
            courseModules: courseModules(state), modules: state.modules, journeys: state.journeys, journeyIssues: state.journeyIssues,
            progress: state.progress, answerMode: state.answerMode, previous: state.previous, selected: state.selected,
            currentJourney: currentJourney(state), lastSession: state.lastSession,
            grammarTopicIds: new Set(state.courses.find(c => c.id === state.selectedCourseId)?.grammarTopics?.map(t => t.id)),
        };
    }
    function applySelection(selection: Selection) {
        if (selection.module) state.selected = selection.module;
        if (selection.journeyKey !== undefined) state.selectedJourneyKey = selection.journeyKey;
        if (selection.introLessonId !== undefined) state.introLessonId = selection.introLessonId;
        if (selection.answerMode) state.answerMode = selection.answerMode;
        if (selection.mode) state.mode = selection.mode;
    }
    /** Jedyne miejsce, w którym plan zmienia stan: wybór, komunikat, pytanie o zastąpienie, otwarcie sesji. */
    async function applyPlan(plan: StartPlan) {
        if (plan.selection) applySelection(plan.selection);
        switch (plan.kind) {
            case 'ignore': return;
            case 'notice': state.notice = plan.text; return;
            case 'resume': state.screen = 'study'; return;
            case 'intro': state.screen = 'lesson-intro'; return;
            case 'open':
                if (plan.confirm !== null && !confirmReplacement(plan.confirm)) return;
                if (plan.afterConfirm) applySelection(plan.afterConfirm);
                await openSession(plan.session, plan.resetRewards);
        }
    }
    async function startStageReview(j: Journey, stage: Journey['stages'][number]) {
        await applyPlan(planStageReview(startInput(), j, stage));
    }
    /** The lesson after the finished one, or the finished one itself for the legendary level. */
    function lessonAfterFinished(action: 'following-lesson' | 'legendary') {
        const found = planLessonAfterFinished(startInput(), action);
        if (found.kind === 'notice') state.notice = found.text;
        if (found.kind !== 'found') return;
        applySelection(found.selection);
        return found;
    }
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if (!isOwnedBy('starts', action)) return false;
        const input = startInput, data = el.dataset;
        switch (action) {
            case 'legendary': await applyPlan(planLegendary(input())); return true;
            case 'module-ritual': await preparePlans(); await applyPlan(planRitual(input(), data)); return true;
            case 'course-mode': await applyPlan(planCourseMode(input(), data)); return true;
            case 'grammar-practice': await applyPlan(planGrammarPractice(input(), data)); return true;
            case 'stage-review': await applyPlan(planStageReviewAction(input(), data)); return true;
            case 'begin-lesson': await preparePlans(); await applyPlan(planBeginLesson(input(), data)); return true;
            case 'extra-training': await applyPlan(planExtraTraining(input(), data)); return true;
            case 'mode': await applyPlan(planMode(input(), data)); return true;
            case 'reading-start': await applyPlan(planReadingStart(input(), data)); return true;
            default: return unhandled(action);
        }
    }
    return { handleAction, preparePlans, openSession, startStageReview, lessonAfterFinished };
}
