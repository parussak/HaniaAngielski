import {rewardStars} from '../learning/rewards.ts';
import {mapRoom} from '../house/rewards.ts';
import {lessonContext} from '../learning/lesson-flow.ts';
import {homeFor,settleHouseUnlocks} from '../house/progress.ts';
import {rewardCompletion} from '../learning/lesson-session.ts';
import type {Journey, JourneyIssue} from '../learning/journey.ts';
import type { Screen } from '../app/state.ts';
import { next, questionFor, recordAnswer, type Module, type Progress, type Session } from '../core.ts';
import { recordStageError } from '../stage-review.ts';
import {finishRetention,rememberError} from '../learning/retention.ts';
import {answerOnBoard,gapTokens,placeGap,closeBoard,boardReady} from '../learning/boards.ts';
import {retryAnswer} from '../learning/retry.ts';
import {continueScene} from '../learning/scenes.ts';
import {readingOf,readingView} from '../learning/readings.ts';
import {readingShown,type ReadingState} from './reading.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';
/**
 * Jedyne, co kontroler odpowiedzi widzi ze stanu (najwęższy dostęp). Dane postępu (`progress`)
 * zmienia wyłącznie port `mutate`; kontroler je tylko czyta. Pola stanu ekranu zmieniają
 * nazwane operacje kontrolera (`showBoardError`, `resetRewards`, `showSummary`).
 */
export interface AnswerState {
    readonly progress: Progress;
    readonly modules: Module[];
    readonly journeys: Journey[];
    readonly journeyIssues: JourneyIssue[];
    readonly readingShown?: ReadingState['readingShown'];
    // Stan ekranu.
    boardError?: {key:string;answer:string;keys?:string[]};
    roomDiscovery?: {session:string;room:string};
    lastReward: number;
    lastStageReward: number;
    lastSession: Session | null;
    screen: Screen;
}
interface SessionAnswerPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
    /** Identyfikator bieżącego kursu (jego portfel gwiazdek). */
    courseId: () => string;
}
// Akcje w trwającej sesji: odpowiedzi, plansze par i luk, poprawka i przejście dalej z nagrodą.
// Rozpoczynanie sesji i nawigacja zostają w `learning.ts`.
export function createSessionAnswerController(state: AnswerState, { mutate, courseId }: SessionAnswerPorts) {
    // Każde pole stanu ekranu zmienia dokładnie jedna nazwana operacja.
    const showBoardError = (key: string, answer: string) => { state.boardError = {key, answer}; };
    const resetRewards = () => { state.lastReward = 0; state.lastStageReward = 0; };
    const showSummary = (session: Session, reward: number, stageReward: number, room?: {session:string;room:string}) => {
        state.roomDiscovery = room; state.lastReward = reward; state.lastStageReward = stageReward; state.lastSession = session; state.screen = 'summary';
    };
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
        if(!isOwnedBy('answers',action))return false;
        switch(action){
        case 'pair-answer':{
            const active=state.progress.active;if(!active?.items[active.index].pairGroup)return true;
            const key=active.pairSelection??active.items[active.index].key,answer=el.dataset.answer??'';
            let ok:boolean|undefined;await mutate(p=>{ok=answerOnBoard(p,state.modules,state.journeys,key,answer);});
            if(ok===false)showBoardError(key,answer);return true;
        }
        case 'gap-place':{
            const key=el.dataset.key??'',answer=el.dataset.answer??state.progress.active?.gapSelection??state.progress.active?.draftAnswer;
            let ok:boolean|undefined;await mutate(p=>{ok=placeGap(p,state.modules,state.journeys,key,answer);});
            if(ok===false)showBoardError(key,answer??'');return true;
        }
        case 'pair-select':case 'bank-select':{
            await mutate(p=>{const s=p.active;if(!s||!['question','retry'].includes(s.phase))return;
                const current=s.items[s.index];
                if(action==='pair-select'&&s.phase==='question'&&current.pairGroup&&s.items.slice(s.index).some(i=>i.key===el.dataset.key&&i.pairGroup===current.pairGroup))s.pairSelection=el.dataset.key;
                if(action==='bank-select'&&current.presentation==='bank'&&gapTokens(state.modules,s).includes(el.dataset.answer??''))s.gapSelection=el.dataset.answer;
            });return true;
        }
        case 'answer':{
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
                // D-68: a reading question keeps its feedback until „Dalej”; a scene gap continues at once.
                else if(!readingOf(state.modules,session.items[session.index]))continueScene(p);
            });
            return true;
        }
        case 'retry':{
            await mutate(p => {retryAnswer(p,el.dataset.key);});
            return true;
        }
        case 'next':{
            await finishItem();
            return true;
        }
        default:return unhandled(action);
        }
    }
    async function finishItem() {
        const active=state.progress.active,current=active?.items[active.index];
        if(active&&(current?.pairGroup||current?.presentation==='bank')&&!boardReady(active))return;
        // D-68: a reading ends only after its last sentence and question.
        const reading=active&&readingView(state.modules,active,readingShown(state));
        if(reading&&reading.next!=='finish')return;
        const rewardCourse=courseId();
        const earned = homeFor(state.progress,rewardCourse)?.earned ?? 0, bonuses = Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length;
        resetRewards();
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
            const session=state.progress.sessions.at(-1)!;
            const context=session.lesson&&lessonContext(state.journeys,state.progress,session);
            const room=context&&mapRoom(context.journey);
            showSummary(session,
                (homeFor(state.progress,rewardCourse)?.earned ?? 0) - earned,
                (Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length - bonuses) * rewardStars.stageMastery,
                room&&unlockedRooms.includes(room.id)?{session:session.id,room:room.id}:undefined);
        }
    }
    return { handleAction };
}
