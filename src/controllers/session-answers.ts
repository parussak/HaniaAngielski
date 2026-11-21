import {rewardStars} from '../learning/rewards.ts';
import {mapRoom} from '../house/rewards.ts';
import {lessonContext} from '../learning/lesson-flow.ts';
import {homeFor,settleHouseUnlocks} from '../house/progress.ts';
import { rewardCompletion } from '../adventure.ts';
import { currentCourse } from '../app/selectors.ts';
import type { AppState } from '../app/state.ts';
import { next, questionFor, recordAnswer, type Progress } from '../core.ts';
import { recordStageError } from '../stage-review.ts';
import {finishRetention,rememberError} from '../learning/retention.ts';
import {answerOnBoard,gapTokens,placeGap,closeBoard,boardReady} from '../learning/boards.ts';
import {retryAnswer} from '../learning/retry.ts';
import {continueScene} from '../learning/scenes.ts';
import {readingOf,readingView} from '../learning/readings.ts';
import {readingShown} from './reading.ts';
interface SessionAnswerPorts {
    mutate: (change: (p: Progress) => void) => Promise<void>;
}
// Akcje w trwającej sesji: odpowiedzi, plansze par i luk, poprawka i przejście dalej z nagrodą.
// Rozpoczynanie sesji i nawigacja zostają w `learning.ts`.
export function createSessionAnswerController(state: AppState, { mutate }: SessionAnswerPorts) {
    async function handleAction(action: string, el: HTMLElement): Promise<boolean> {
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
        if(action==='pair-select'||action==='bank-select'){
            await mutate(p=>{const s=p.active;if(!s||!['question','retry'].includes(s.phase))return;
                const current=s.items[s.index];
                if(action==='pair-select'&&s.phase==='question'&&current.pairGroup&&s.items.slice(s.index).some(i=>i.key===el.dataset.key&&i.pairGroup===current.pairGroup))s.pairSelection=el.dataset.key;
                if(action==='bank-select'&&current.presentation==='bank'&&gapTokens(state.modules,s).includes(el.dataset.answer??''))s.gapSelection=el.dataset.answer;
            });return true;
        }
        if (action === 'answer') {
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
        if (action === 'retry') {
            await mutate(p => {retryAnswer(p,el.dataset.key);});
            return true;
        }
        if (action === 'next') {
            await finishItem();
            return true;
        }
        return false;
    }
    async function finishItem() {
        const active=state.progress.active,current=active?.items[active.index];
        if(active&&(current?.pairGroup||current?.presentation==='bank')&&!boardReady(active))return;
        // D-68: a reading ends only after its last sentence and question.
        const reading=active&&readingView(state.modules,active,readingShown(state));
        if(reading&&reading.next!=='finish')return;
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
            const session=state.progress.sessions.at(-1)!;
            const context=session.lesson&&lessonContext(state.journeys,state.progress,session);
            const room=context&&mapRoom(context.journey);
            state.roomDiscovery=room&&unlockedRooms.includes(room.id)?{session:session.id,room:room.id}:undefined;
            state.lastReward = (homeFor(state.progress,rewardCourse)?.earned ?? 0) - earned;
            state.lastStageReward = (Object.values(state.progress.adventure?.stageReviews ?? {}).filter(r => r.rewardedAt).length - bonuses) * rewardStars.stageMastery;
            state.lastSession = state.progress.sessions.at(-1)!;
            state.screen = 'summary';
        }
    }
    return { handleAction };
}
